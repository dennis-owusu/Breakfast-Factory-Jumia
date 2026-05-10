import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Axios instance for Paystack API
const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a Paystack payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const initializePayment = async (req, res, next) => {
  try {
    const { email, amount, orderId, callback_url, metadata = {} } = req.body;

    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Email and amount are required',
      });
    }

    // Generate a unique reference
    const reference = `PAY-${uuidv4()}`;

    // Prepare Paystack payment data
    const paymentData = {
      email,
      amount: Math.round(amount * 100), // Convert to pesewas (smallest currency unit)
      reference,
      callback_url: callback_url || `${process.env.CLIENT_URL}/payment/verify`,
      metadata: {
        ...metadata,
        orderId: orderId || null,
        userId: req.user?.id || null,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId || "N/A"
          },
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: req.user?.name || email
          }
        ]
      },
    };

    // Make request to Paystack API
    const response = await paystackAPI.post('/transaction/initialize', paymentData);

    if (response.data.status) {
      // Create a pending payment record in our database
      const payment = new Payment({
        referenceId: reference,
        userId: req.user?.id || null,
        orderId: orderId || null,
        amount: amount,
        currency: 'GHS',
        paymentMethod: 'paystack',
        payerEmail: email,
        status: 'pending',
        metadata: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
        }
      });

      await payment.save();

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: reference,
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize payment',
        error: response.data.message,
      });
    }
  } catch (error) {
    console.error('Paystack initialization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Verify a Paystack payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { reference, trxref } = req.query;
    const paymentReference = reference || trxref;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
      });
    }

    // Find the payment in our database
    const payment = await Payment.findOne({ referenceId: paymentReference });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify the payment with Paystack API
    const response = await paystackAPI.get(`/transaction/verify/${paymentReference}`);

    if (response.data.status && response.data.data.status === 'success') {
      // Update payment status in database
      payment.status = 'paid';
      payment.metadata = {
        ...payment.metadata,
        gateway_response: response.data.data.gateway_response,
        paid_at: response.data.data.paid_at,
        channel: response.data.data.channel,
        card_type: response.data.data.authorization?.card_type,
        last4: response.data.data.authorization?.last4,
        exp_month: response.data.data.authorization?.exp_month,
        exp_year: response.data.data.authorization?.exp_year,
      };
      await payment.save();

      // Update the associated order if exists
      if (payment.orderId) {
        await Order.findByIdAndUpdate(payment.orderId, {
          status: 'processing',
          'paymentDetails.status': 'paid',
          'paymentDetails.transactionId': paymentReference,
          'paymentDetails.paidAt': new Date(),
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference: paymentReference,
          amount: response.data.data.amount / 100, // Convert back from pesewas
          status: 'paid',
          paid_at: response.data.data.paid_at,
        }
      });
    } else {
      // Payment failed or is pending
      payment.status = response.data.data.status === 'failed' ? 'failed' : 'pending';
      payment.metadata = {
        ...payment.metadata,
        gateway_response: response.data.data.gateway_response,
        status: response.data.data.status,
      };
      await payment.save();

      return res.status(400).json({
        success: false,
        message: `Payment ${response.data.data.status}`,
        data: {
          reference: paymentReference,
          status: response.data.data.status,
          gateway_response: response.data.data.gateway_response,
        }
      });
    }
  } catch (error) {
    console.error('Paystack verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Handle Paystack webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const handleWebhook = async (req, res, next) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    const event = req.body;

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Update payment and order status
        const payment = await Payment.findOne({
          referenceId: event.data.reference,
        });

        if (payment) {
          payment.status = 'paid';
          payment.metadata = {
            ...payment.metadata,
            gateway_response: event.data.gateway_response,
            paid_at: event.data.paid_at,
            channel: event.data.channel,
          };
          await payment.save();

          // Update order if exists
          if (payment.orderId) {
            await Order.findByIdAndUpdate(payment.orderId, {
              status: 'processing',
              'paymentDetails.status': 'paid',
              'paymentDetails.transactionId': event.data.reference,
              'paymentDetails.paidAt': new Date(),
            });
          }
        }
        break;

      case 'charge.failed':
        // Handle failed payment
        const failedPayment = await Payment.findOne({
          referenceId: event.data.reference,
        });

        if (failedPayment) {
          failedPayment.status = 'failed';
          failedPayment.metadata = {
            ...failedPayment.metadata,
            gateway_response: event.data.gateway_response,
            status: event.data.status,
          };
          await failedPayment.save();
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    // Acknowledge webhook
    res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

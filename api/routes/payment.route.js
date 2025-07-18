import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../utils/verifyUser.js';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';

const router = express.Router();

// Endpoint to save Paystack transaction (called from frontend after successful payment)
router.post('/paystack/save', async (req, res) => {
  const { reference, amount, currency = 'GHS', orderId, outletId, email } = req.body;

  // Validate input
  if (!reference || !amount || !orderId || !outletId || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to verify transaction');
    }

    const data = await response.json();
    if (data.data.status !== 'success') {
      return res.status(400).json({ message: 'Transaction not successful' });
    }

    // Store transaction
    const payment = new Payment({
      referenceId: reference,
      outletId,
      orderId,
      amount,
      currency,
      payerEmail: email, // Assuming email instead of phone for Paystack
      status: 'paid'
    });
    await payment.save();

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status: 'paid' });

    res.status(200).json({ message: 'Transaction saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin endpoint to view transactions by outlet (kept as is)
router.get('/outlet/:outletId', async (req, res) => {
  const { outletId } = req.params;

  try {
    const transactions = await Payment.find({ outletId }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MTN Mobile Money payment verification (called by webhook from MTN)
router.post('/mtn-momo/verify/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    let status = 'FAILED';
    
    // First, respond to the payment provider (MTN) with a success acknowledgment
    // This is important for webhooks to prevent retries
    res.status(200).json({
      success: true,
      message: 'Webhook received successfully',
      transactionId
    });
    
    // Check if we have MTN API credentials for verification
    const MTN_CONSUMER_KEY = process.env.MTN_CONSUMER_KEY;
    const MTN_CONSUMER_SECRET = process.env.MTN_CONSUMER_SECRET;
    
    // If we have API credentials, check the transaction status with MTN
    if (MTN_CONSUMER_KEY && MTN_CONSUMER_SECRET) {
      try {

        const MTN_API_URL = process.env.MTN_API_URL || 'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay';
        const statusUrl = `${MTN_API_URL}/${transactionId}`;
        
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {

            'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
            'Ocp-Apim-Subscription-Key': MTN_CONSUMER_KEY
          }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          status = statusData.status;
        } else {
          console.error(`Failed to verify transaction status: ${statusResponse.status}`);
          // If we can't verify with MTN, use the status from the webhook payload
          status = req.body.status || 'FAILED';
        }
      } catch (verifyError) {
        console.error('Error verifying transaction with MTN:', verifyError);
        // If verification fails, use the status from the webhook payload
        status = req.body.status || 'FAILED';
      }
    } else {
      status = req.body.status || 'FAILED';
      console.log('No MTN credentials found, using webhook status or defaulting to FAILED');
    }
    
    // Forward the verification to update the order
    // In a production environment, you would use a queue or separate process
    // to ensure the order update happens even if this request fails
    try {
      const orderUpdateResponse = await fetch(`${req.protocol}://${req.get('host')}/api/route/verify-momo-payment/${transactionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!orderUpdateResponse.ok) {
        console.error(`Failed to update order status: ${orderUpdateResponse.status}`);
      }
    } catch (updateError) {
      console.error('Error forwarding payment verification:', updateError);
    }
    
  } catch (error) {
    console.error('Error handling MTN Mobile Money webhook:', error);
    // We've already sent a 200 response to the webhook, so we just log the error
  }
});

export default router;
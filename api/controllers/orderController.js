import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import axios from 'axios';

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private/User
 */
export const createOrder = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { 
      orderItems, 
      shipping, 
      payment,
      itemsPrice, 
      shippingPrice, 
      totalPrice 
    } = req.body;

    // Verify all products exist and have sufficient stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with id ${item.product}`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Available: ${product.stock}`
        });
      }
    }

    // Create the order
    const order = new Order({
      user: req.user.id,
      orderItems,
      shipping,
      payment,
      itemsPrice,
      shippingPrice,
      totalPrice
    });

    // If payment method is Paystack, initialize transaction
    if (payment.method === 'paystack') {
      try {
        const paystackResponse = await initializePaystackTransaction(order, req.user);
        
        // Save the payment reference
        order.payment.reference = paystackResponse.data.reference;
        await order.save();
        
        // Return the authorization URL for the frontend to redirect to
        return res.status(201).json({
          success: true,
          order,
          paymentUrl: paystackResponse.data.authorization_url
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Payment initialization failed',
          error: error.response ? error.response.data : error.message
        });
      }
    } else {
      // For cash on delivery, just save the order
      await order.save();
      
      // Update product stock
      await updateProductStock(orderItems);
      
      return res.status(201).json({
        success: true,
        order
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get all orders for current user
 * @route   GET /api/orders
 * @access  Private/User
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'title images price',
        populate: {
          path: 'outlet',
          select: 'name'
        }
      });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private/User
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'title images price outlet',
        populate: {
          path: 'outlet',
          select: 'name'
        }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the order belongs to the user or if user is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin/Outlet
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update the status
    order.status = status;
    
    // If status is delivered, set deliveredAt
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Verify Paystack payment
 * @route   GET /api/orders/verify-payment/:reference
 * @access  Public
 */
export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // Find order with this reference
    const order = await Order.findOne({ 'payment.reference': reference });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found with this payment reference'
      });
    }

    // Verify the payment with Paystack
    try {
      const paystackResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      const { data } = paystackResponse.data;

      // If payment is successful
      if (data.status === 'success') {
        // Update order payment status
        order.payment.status = 'completed';
        order.payment.paidAt = Date.now();
        
        // Update product stock
        await updateProductStock(order.orderItems);
        
        await order.save();

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          order
        });
      } else {
        // Payment failed
        order.payment.status = 'failed';
        await order.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          data
        });
      }
    } catch (error) {
      console.error('Paystack verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying payment with Paystack',
        error: error.response ? error.response.data : error.message
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Paystack webhook handler
 * @route   POST /api/orders/paystack-webhook
 * @access  Public
 */
export const paystackWebhook = async (req, res) => {
  try {
    // Verify that the request is from Paystack
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    // Handle the event
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      
      // Find order with this reference
      const order = await Order.findOne({ 'payment.reference': reference });
      
      if (order) {
        // Update order payment status
        order.payment.status = 'completed';
        order.payment.paidAt = Date.now();
        
        // Update product stock
        await updateProductStock(order.orderItems);
        
        await order.save();
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to initialize Paystack transaction
const initializePaystackTransaction = async (order, user) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: Math.round(order.totalPrice * 100), // Paystack amount is in kobo (multiply by 100)
        callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
        metadata: {
          order_id: order._id.toString(),
          custom_fields: [
            {
              display_name: 'Order Number',
              variable_name: 'order_number',
              value: order.orderNumber
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw error;
  }
};

// Helper function to update product stock after order
const updateProductStock = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity } }
    );
  }
};
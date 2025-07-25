import Subscription from '../models/subscription.model.js';
import Payment from '../models/payment.model.js';
import { errorHandler } from '../utils/error.js';

// Create a new subscription
export const createSubscription = async (req, res, next) => {
  try {
    const { userId, plan, paymentId } = req.body;
    
    // Calculate end date based on plan
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    if (plan === 'free') {
      // Free tier valid for 2 weeks
      endDate.setDate(endDate.getDate() + 14);
    } else if (plan === 'pro') {
      // Pro tier valid for 1 month
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // Set features based on plan
    let features = [];
    let price = 0;
    
    if (plan === 'free') {
      features = ['Basic Analytics', 'Limited Product Listings', 'Standard Support'];
      price = 0;
    } else if (plan === 'pro') {
      features = ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support', 'Featured Listings', 'Custom Branding'];
      price = 300; // 300 GHS per month
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({ 
      userId, 
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (existingSubscription) {
      return next(errorHandler(400, 'User already has an active subscription'));
    }
    
    // Create new subscription
    const newSubscription = new Subscription({
      userId,
      plan,
      startDate,
      endDate,
      status: 'active',
      paymentId,
      features,
      price,
      currency: 'GHS'
    });
    
    await newSubscription.save();
    
    res.status(201).json({
      success: true,
      message: `Successfully subscribed to ${plan} plan`,
      subscription: newSubscription
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription by user ID
export const getSubscriptionByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const subscription = await Subscription.findOne({ 
      userId, 
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (!subscription) {
      return res.status(200).json({
        success: true,
        hasActiveSubscription: false,
        message: 'No active subscription found'
      });
    }
    
    res.status(200).json({
      success: true,
      hasActiveSubscription: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return next(errorHandler(404, 'Subscription not found'));
    }
    
    // Update subscription status
    subscription.status = 'cancelled';
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Renew subscription
export const renewSubscription = async (req, res, next) => {
  try {
    const { subscriptionId, paymentId } = req.body;
    
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return next(errorHandler(404, 'Subscription not found'));
    }
    
    // Calculate new end date
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    if (subscription.plan === 'free') {
      endDate.setDate(endDate.getDate() + 14);
    } else if (subscription.plan === 'pro') {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // Update subscription
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.status = 'active';
    subscription.paymentId = paymentId;
    
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription renewed successfully',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// Upgrade subscription from free to pro
export const upgradeSubscription = async (req, res, next) => {
  try {
    const { subscriptionId, paymentId } = req.body;
    
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return next(errorHandler(404, 'Subscription not found'));
    }
    
    if (subscription.plan === 'pro') {
      return next(errorHandler(400, 'Subscription is already on pro plan'));
    }
    
    // Calculate new end date (1 month from now for pro plan)
    const startDate = new Date();
    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Update subscription to pro
    subscription.plan = 'pro';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.status = 'active';
    subscription.paymentId = paymentId;
    subscription.features = ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support', 'Featured Listings', 'Custom Branding'];
    subscription.price = 300;
    
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription upgraded to pro successfully',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// Get all subscriptions (admin only)
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });
  } catch (error) {
    next(error);
  }
};
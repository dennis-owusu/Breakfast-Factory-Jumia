import Subscription from '../models/subscription.model.js';
import Payment from '../models/payment.model.js';
import { errorHandler } from '../utils/error.js';

// Create a new subscription
export const createSubscription = async (req, res, next) => {
  try {
    const { userId, plan, paymentId } = req.body;
    
    const startDate = new Date(); // Use UTC
    startDate.setUTCHours(0, 0, 0, 0);
    let endDate = new Date(startDate);
    
    if (plan === 'free') {
      endDate.setUTCDate(endDate.getUTCDate() + 14);
    } else if (plan === 'monthly') {
      endDate.setUTCMonth(endDate.getUTCMonth() + 1); 
    } else if (plan === 'bimonthly') {
      endDate.setUTCMonth(endDate.getUTCMonth() + 2);
    }
    
    // Set features based on plan
    let features = [];
    let price = 0;
    
    if (plan === 'free') {
      features = ['Basic Analytics', 'Limited Product Listings', 'Standard Support'];
      price = 0;
    } else if (plan === 'monthly') {
      features = ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support', 'Featured Listings', 'Custom Branding'];
      price = 150; // 150 GHS per month
    } else if (plan === 'bimonthly') {
      features = ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support', 'Featured Listings', 'Custom Branding'];
      price = 300; // 300 GHS for 2 months
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
      currency: 'GHS',
      history: [{ action: 'created' }]
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
    
    let subscription = await Subscription.findOne({ userId });
    
    if (subscription) {
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      if (subscription.status === 'active' && subscription.endDate <= now) {
        subscription.status = 'expired';
        subscription.history.push({ action: 'expired' });
        await subscription.save();
      }
    }
    
    
    if (!subscription) {
      return res.status(200).json({
        success: true,
        hasActiveSubscription: false
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
    } else if (subscription.plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscription.plan === 'bimonthly') {
      endDate.setMonth(endDate.getMonth() + 2);
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
    
    // For simplicity, assuming upgrade is to a specified plan in req.body
    const { newPlan } = req.body;
    if (!['monthly', 'bimonthly'].includes(newPlan)) {
      return next(errorHandler(400, 'Invalid upgrade plan'));
    }
    if (subscription.plan === newPlan) {
      return next(errorHandler(400, `Subscription is already on ${newPlan} plan`));
    }
    
    // Calculate new end date
    const startDate = new Date();
    let endDate = new Date(startDate);
    if (newPlan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (newPlan === 'bimonthly') {
      endDate.setMonth(endDate.getMonth() + 2);
    }
    
    // Set features and price
    let features = ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support', 'Featured Listings', 'Custom Branding'];
    let price = newPlan === 'monthly' ? 150 : 300;
    
    // Update subscription
    subscription.plan = newPlan;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.status = 'active';
    subscription.paymentId = paymentId;
    subscription.features = features;
    subscription.price = price;
    
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: `Subscription upgraded to ${newPlan} successfully`,
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
import Subscription from '../models/subscription.model.js';
import Payment from '../models/payment.model.js';
import { errorHandler } from '../utils/error.js';
import {
  checkActiveSubscription,
  checkAndUpdateExpiredSubscription,
  createSubscription as createSubscriptionService,
  renewSubscription as renewSubscriptionService
} from '../services/subscription.service.js';

// Create a new subscription
export const createSubscription = async (req, res, next) => {
  try {
    const { userId, plan, paymentId } = req.body;

    // Check if user already has an active subscription using the service
    const existingCheck = await checkActiveSubscription(userId);
    if (existingCheck.hasActiveSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
        subscription: existingCheck.subscription
      });
    }

    // Create subscription using the service
    const newSubscription = await createSubscriptionService({
      userId,
      plan,
      paymentId
    });

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to ${plan} plan`,
      subscription: newSubscription
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription by user ID - ALWAYS checks fresh status
export const getSubscriptionByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Use the service to check active subscription (real-time check)
    const subscriptionCheck = await checkActiveSubscription(userId);

    // If no active subscription found, also check for expired ones
    if (!subscriptionCheck.hasActiveSubscription) {
      const expiredSubscription = await Subscription.findOne({
        userId,
        status: { $in: ['expired', 'cancelled'] }
      }).sort({ endDate: -1 });

      if (expiredSubscription) {
        return res.status(200).json({
          success: true,
          hasActiveSubscription: false,
          subscription: expiredSubscription,
          isExpired: true,
          message: 'Your subscription has expired'
        });
      }
    }

    // Return the active subscription check result
    res.status(200).json({
      success: true,
      hasActiveSubscription: subscriptionCheck.hasActiveSubscription,
      subscription: subscriptionCheck.subscription,
      isExpired: subscriptionCheck.isExpired || false,
      isExpiringSoon: subscriptionCheck.subscription?.isExpiringSoon || false,
      daysUntilExpiry: subscriptionCheck.subscription?.daysUntilExpiry || 0
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
    subscription.history.push({
      action: 'cancelled',
      date: new Date(),
      reason: 'User cancelled'
    });
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

    // Use the service to renew
    const subscription = await renewSubscriptionService(subscriptionId, paymentId);

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
    subscription.history.push({
      action: 'upgraded',
      date: new Date(),
      details: { fromPlan: subscription.plan, toPlan: newPlan }
    });

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

    // Check and update expired subscriptions in real-time
    const now = new Date();
    const updatedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        if (sub.status === 'active' && sub.endDate <= now) {
          sub.status = 'expired';
          sub.history.push({
            action: 'auto_expired',
            date: now,
            reason: 'Subscription period ended'
          });
          await sub.save();
        }
        return sub;
      })
    );

    res.status(200).json({
      success: true,
      count: updatedSubscriptions.length,
      subscriptions: updatedSubscriptions
    });
  } catch (error) {
    next(error);
  }
};

// Check subscription status (real-time check endpoint)
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await checkActiveSubscription(userId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

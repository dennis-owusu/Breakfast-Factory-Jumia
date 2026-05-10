import Subscription from '../models/subscription.model.js';

/**
 * Subscription Service - Centralized subscription logic
 * Handles all subscription operations and status checks
 */

/**
 * Check if a user has an active subscription
 * This is the primary method - always checks fresh from DB
 */
export const checkActiveSubscription = async (userId) => {
  try {
    const now = new Date();
    
    // Find any subscription that is:
    // 1. Belongs to the user
    // 2. Has status 'active'
    // 3. Has not expired (endDate > now)
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: now }
    });

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        isExpired: false
      };
    }

    // Check if subscription is about to expire (within 3 days)
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const isExpiringSoon = subscription.endDate <= threeDaysFromNow;

    return {
      hasActiveSubscription: true,
      subscription: {
        ...subscription.toObject(),
        isExpiringSoon,
        daysUntilExpiry: Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24))
      },
      isExpired: false
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
};

/**
 * Check if a subscription has expired and update its status
 * This should be called when fetching a subscription
 */
export const checkAndUpdateExpiredSubscription = async (subscription) => {
  try {
    const now = new Date();
    
    if (subscription.status === 'active' && subscription.endDate <= now) {
      // Subscription has expired - update it
      subscription.status = 'expired';
      subscription.history.push({
        action: 'auto_expired',
        date: now,
        reason: 'Subscription period ended'
      });
      await subscription.save();
      
      return {
        ...subscription.toObject(),
        isExpired: true,
        wasAutoExpired: true
      };
    }
    
    return subscription;
  } catch (error) {
    console.error('Error checking expired subscription:', error);
    throw error;
  }
};

/**
 * Create a new subscription with proper validation
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const { userId, plan, paymentId } = subscriptionData;
    
    // Check if user already has an active subscription
    const existingCheck = await checkActiveSubscription(userId);
    if (existingCheck.hasActiveSubscription) {
      throw new Error('User already has an active subscription');
    }
    
    const now = new Date();
    let endDate = new Date(now);
    let features = [];
    let price = 0;
    
    // Calculate end date and features based on plan
    switch (plan) {
      case 'free':
        endDate.setDate(endDate.getDate() + 14);
        features = ['Basic Analytics', 'Limited Product Listings', 'Standard Support'];
        price = 0;
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        features = ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support', 'Featured Listings', 'Custom Branding'];
        price = 150;
        break;
      case 'bimonthly':
        endDate.setMonth(endDate.getMonth() + 2);
        features = ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support', 'Featured Listings', 'Custom Branding'];
        price = 300;
        break;
      default:
        throw new Error('Invalid plan type');
    }
    
    const subscription = new Subscription({
      userId,
      plan,
      startDate: now,
      endDate,
      status: 'active',
      paymentId,
      features,
      price,
      currency: 'GHS',
      history: [{
        action: 'created',
        date: now,
        details: { plan, price, paymentId }
      }]
    });
    
    await subscription.save();
    
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Renew an existing subscription
 */
export const renewSubscription = async (subscriptionId, paymentId) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    const now = new Date();
    let newEndDate = new Date(now);
    
    // Calculate new end date based on plan
    switch (subscription.plan) {
      case 'free':
        newEndDate.setDate(newEndDate.getDate() + 14);
        break;
      case 'monthly':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'bimonthly':
        newEndDate.setMonth(newEndDate.getMonth() + 2);
        break;
    }
    
    // Update subscription
    subscription.startDate = now;
    subscription.endDate = newEndDate;
    subscription.status = 'active';
    subscription.paymentId = paymentId;
    subscription.history.push({
      action: 'renewed',
      date: now,
      details: { paymentId, newEndDate }
    });
    
    await subscription.save();
    
    return subscription;
  } catch (error) {
    console.error('Error renewing subscription:', error);
    throw error;
  }
};

export default {
  checkActiveSubscription,
  checkAndUpdateExpiredSubscription,
  createSubscription,
  renewSubscription
};

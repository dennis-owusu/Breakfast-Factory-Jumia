import { checkActiveSubscription } from '../services/subscription.service.js';

/**
 * Middleware to check subscription status WITHOUT blocking access
 * This attaches subscription info to the request but never blocks the user
 * 
 * Usage: Use this when you want to know subscription status but allow all access
 */
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId || req.body?.userId;

    // No userId found - just continue without subscription info
    if (!userId) {
      req.subscriptionInfo = {
        hasChecked: false,
        hasActiveSubscription: false,
        subscription: null
      };
      return next();
    }

    // Check subscription status (non-blocking)
    const subscriptionCheck = await checkActiveSubscription(userId);

    // Attach info to request
    req.subscriptionInfo = {
      hasChecked: true,
      hasActiveSubscription: subscriptionCheck.hasActiveSubscription,
      subscription: subscriptionCheck.subscription,
      isExpiringSoon: subscriptionCheck.subscription?.isExpiringSoon || false,
      daysUntilExpiry: subscriptionCheck.subscription?.daysUntilExpiry || 0
    };

    // Log for debugging (optional)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Subscription check for user ${userId}:`, {
        hasActive: subscriptionCheck.hasActiveSubscription,
        plan: subscriptionCheck.subscription?.plan || 'none'
      });
    }

    next();
  } catch (error) {
    // Log error but don't block the request
    console.error('⚠️  Error checking subscription (non-blocking):', error);
    
    req.subscriptionInfo = {
      hasChecked: false,
      hasActiveSubscription: false,
      subscription: null,
      error: error.message
    };
    
    next();
  }
};

/**
 * Legacy middleware - keeps compatibility with old code
 * Same as checkSubscriptionStatus - does NOT block access
 * @deprecated Use checkSubscriptionStatus instead
 */
export const checkSubscription = checkSubscriptionStatus;

/**
 * Middleware for routes that REQUIRE an active subscription
 * Only use this for premium features that truly need subscription
 * 
 * This will BLOCK access if no active subscription
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    // First check subscription status
    await new Promise((resolve, reject) => {
      checkSubscriptionStatus(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if we have an active subscription
    if (!req.subscriptionInfo?.hasActiveSubscription) {
      return res.status(403).json({
        success: false,
        message: 'This feature requires an active subscription',
        code: 'SUBSCRIPTION_REQUIRED',
        subscriptionInfo: req.subscriptionInfo,
        upgradeUrl: '/subscription/upgrade' // Helpful for frontend
      });
    }

    next();
  } catch (error) {
    console.error('Error in requireActiveSubscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription'
    });
  }
};

/**
 * Quick middleware that just adds subscription info to response
 * Useful for routes that want to show subscription status in the response
 */
export const includeSubscriptionInfo = async (req, res, next) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override json method to include subscription info
  res.json = function(data) {
    // If we have subscription info, include it in the response
    if (req.subscriptionInfo) {
      data.subscriptionInfo = req.subscriptionInfo;
    }
    return originalJson.call(this, data);
  };
  
  next();
};

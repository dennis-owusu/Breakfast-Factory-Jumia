/**
 * Subscription Utility Functions
 * These are helper functions to check subscription status in the frontend
 * Note: Subscription is OPTIONAL - these are for UI display only
 */

/**
 * Check if user has an active subscription
 * @param {Object} subscription - The subscription object from API
 * @returns {Boolean}
 */
export const hasActiveSubscription = (subscription) => {
  if (!subscription) return false;
  return subscription.status === 'active' && new Date(subscription.endDate) > new Date();
};

/**
 * Get subscription status label for display
 * @param {Object} subscription 
 * @returns {String}
 */
export const getSubscriptionStatusLabel = (subscription) => {
  if (!subscription) return 'Free Plan';
  
  switch (subscription.status) {
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Free Plan';
  }
};

/**
 * Get days remaining until subscription expires
 * @param {Object} subscription 
 * @returns {Number}
 */
export const getDaysRemaining = (subscription) => {
  if (!subscription || !subscription.endDate) return 0;
  
  const endDate = new Date(subscription.endDate);
  const now = new Date();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * Check if subscription is expiring soon (within 3 days)
 * @param {Object} subscription 
 * @returns {Boolean}
 */
export const isExpiringSoon = (subscription) => {
  if (!subscription || subscription.status !== 'active') return false;
  return getDaysRemaining(subscription) <= 3;
};

/**
 * Get plan features
 * @param {String} plan 
 * @returns {Array}
 */
export const getPlanFeatures = (plan) => {
  switch (plan) {
    case 'free':
      return [
        'Basic Analytics',
        'Limited Product Listings',
        'Standard Support'
      ];
    case 'monthly':
    case 'bimonthly':
      return [
        'Advanced Analytics',
        'Unlimited Product Listings',
        'Priority Support',
        'Featured Listings',
        'Custom Branding'
      ];
    default:
      return [];
  }
};

/**
 * Format price for display
 * @param {Number} price 
 * @param {String} currency 
 * @returns {String}
 */
export const formatPrice = (price, currency = 'GHS') => {
  return `${currency} ${price.toFixed(2)}`;
};

/**
 * Get plan display name
 * @param {String} plan 
 * @returns {String}
 */
export const getPlanDisplayName = (plan) => {
  switch (plan) {
    case 'free':
      return 'Free Plan';
    case 'monthly':
      return 'Monthly Plan';
    case 'bimonthly':
      return 'Bi-Monthly Plan';
    default:
      return 'Free Plan';
  }
};

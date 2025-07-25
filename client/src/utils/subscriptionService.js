// Subscription service for handling API calls related to subscriptions

/**
 * Get the current user's subscription
 * @param {string} userId - The user ID
 * @returns {Promise} - The subscription data
 */
export const getUserSubscription = async (userId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/route/subscription/user/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

/**
 * Create a new subscription
 * @param {Object} subscriptionData - The subscription data
 * @returns {Promise} - The created subscription
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const response = await fetch('http://localhost:3000/api/route/subscription', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId - The subscription ID
 * @returns {Promise} - The result of the cancellation
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/route/subscription/cancel/${subscriptionId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Renew a subscription
 * @param {Object} renewalData - The renewal data
 * @returns {Promise} - The renewed subscription
 */
export const renewSubscription = async (renewalData) => {
  try {
    const response = await fetch('http://localhost:3000/api/route/subscription/renew', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(renewalData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to renew subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error renewing subscription:', error);
    throw error;
  }
};

/**
 * Upgrade a subscription from free to pro
 * @param {Object} upgradeData - The upgrade data
 * @returns {Promise} - The upgraded subscription
 */
export const upgradeSubscription = async (upgradeData) => {
  try {
    const response = await fetch('http://localhost:3000/api/route/subscription/upgrade', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upgradeData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upgrade subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
};

/**
 * Get all subscriptions (admin only)
 * @returns {Promise} - All subscriptions
 */
export const getAllSubscriptions = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/route/subscriptions', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch subscriptions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    throw error;
  }
};
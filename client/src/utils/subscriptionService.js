// Subscription service for handling API calls related to subscriptions

/**
 * Get the current user's subscription
 * @param {string} userId - The user ID
 * @returns {Promise} - The subscription data
 */
export const getUserSubscription = async (userId) => {
  try {
    // For debugging purposes, return a mock subscription
    console.log('Fetching subscription for user:', userId);
    
    // Uncomment this section when API is working
    /*
    const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/subscription/user/${userId}`, {
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
    */
    
    // Return mock data for debugging
    return {
      success: true,
      hasActiveSubscription: true,
      subscription: {
        _id: 'mock-subscription-id',
        userId: userId,
        plan: 'pro',
        status: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
        price: 300,
        currency: 'GHS'
      }
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    // Return mock data instead of throwing error
    return {
      success: true,
      hasActiveSubscription: true,
      subscription: {
        _id: 'mock-subscription-id-error',
        userId: userId,
        plan: 'pro',
        status: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
        price: 300,
        currency: 'GHS'
      }
    };
  }
};

/**
 * Create a new subscription
 * @param {Object} subscriptionData - The subscription data
 * @returns {Promise} - The created subscription
 */
export const createSubscription = async (subscriptionData) => {
  try {
    // For debugging purposes, log the subscription data and return mock response
    console.log('Creating subscription with data:', subscriptionData);
    
    // Uncomment this section when API is working
    /*
    const response = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/subscription', {
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
    */
    
    // Return mock data for debugging
    return {
      success: true,
      message: `Successfully subscribed to ${subscriptionData.plan} plan`,
      subscription: {
        _id: 'mock-subscription-id-' + Date.now(),
        userId: subscriptionData.userId,
        plan: subscriptionData.plan,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        features: subscriptionData.plan === 'pro' 
          ? ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support']
          : ['Basic Analytics', 'Limited Product Listings', 'Standard Support'],
        price: subscriptionData.plan === 'pro' ? 300 : 0,
        currency: 'GHS'
      }
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    // Return mock data instead of throwing error
    return {
      success: true,
      message: `Successfully subscribed to ${subscriptionData?.plan || 'pro'} plan`,
      subscription: {
        _id: 'mock-subscription-id-error-' + Date.now(),
        userId: subscriptionData?.userId || 'default-user',
        plan: subscriptionData?.plan || 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
        price: 300,
        currency: 'GHS'
      }
    };
  }
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId - The subscription ID
 * @returns {Promise} - The result of the cancellation
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    // For debugging purposes, log the subscription ID and return mock response
    console.log('Cancelling subscription with ID:', subscriptionId);
    
    // Uncomment this section when API is working
    /*
    const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/subscription/cancel/${subscriptionId}`, {
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
    */
    
    // Return mock data for debugging
    return {
      success: true,
      message: 'Subscription cancelled successfully'
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    // Return mock data instead of throwing error
    return {
      success: true,
      message: 'Subscription cancelled successfully'
    };
  }
};

/**
 * Renew a subscription
 * @param {Object} renewalData - The renewal data
 * @returns {Promise} - The renewed subscription
 */
export const renewSubscription = async (renewalData) => {
  try {
    // For debugging purposes, log the renewal data and return mock response
    console.log('Renewing subscription with data:', renewalData);
    
    // Uncomment this section when API is working
    /*
    const response = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/subscription/renew', {
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
    */
    
    // Return mock data for debugging
    return {
      success: true,
      message: 'Subscription renewed successfully',
      subscription: {
        _id: 'mock-subscription-id-' + Date.now(),
        userId: renewalData.userId,
        plan: renewalData.plan || 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
        price: 300,
        currency: 'GHS'
      }
    };
  } catch (error) {
    console.error('Error renewing subscription:', error);
    // Return mock data instead of throwing error
    return {
      success: true,
      message: 'Subscription renewed successfully',
      subscription: {
        _id: 'mock-subscription-id-error-' + Date.now(),
        userId: renewalData?.userId || 'default-user',
        plan: renewalData?.plan || 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
        price: 300,
        currency: 'GHS'
      }
    };
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
    // For debugging purposes, log and return mock response
    console.log('Fetching all subscriptions');
    
    // Uncomment this section when API is working
    /*
    const response = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/subscriptions', {
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
    */
    
    // Return mock data for debugging
    return {
      success: true,
      subscriptions: [
        {
          _id: 'mock-subscription-id-1',
          userId: 'user-1',
          plan: 'pro',
          status: 'active',
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
          price: 300,
          currency: 'GHS'
        },
        {
          _id: 'mock-subscription-id-2',
          userId: 'user-2',
          plan: 'free',
          status: 'active',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          features: ['Basic Analytics', 'Limited Product Listings', 'Standard Support'],
          price: 0,
          currency: 'GHS'
        },
        {
          _id: 'mock-subscription-id-3',
          userId: 'user-3',
          plan: 'pro',
          status: 'cancelled',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
          price: 300,
          currency: 'GHS'
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    // Return mock data instead of throwing error
    return {
      success: true,
      subscriptions: [
        {
          _id: 'mock-subscription-id-error-1',
          userId: 'user-1',
          plan: 'pro',
          status: 'active',
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          features: ['Advanced Analytics', 'Unlimited Product Listings', 'Priority Support'],
          price: 300,
          currency: 'GHS'
        }
      ]
    };
  }
};
import api from './api';

// Subscription service for handling API calls related to subscriptions

export const getUserSubscription = async (userId) => {
  try {
    const response = await api.get(`/api/route/subscription/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { success: true, hasActiveSubscription: false, message: 'No active subscription found' };
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const response = await api.post('/api/route/subscription', subscriptionData);
    return response.data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await api.put(`/api/route/subscription/cancel/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

export const renewSubscription = async (renewalData) => {
  try {
    const response = await fetch(`${API_BASE}/subscription/renew`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renewalData),
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to renew subscription');
    return await response.json();
  } catch (error) {
    console.error('Error renewing subscription:', error);
    throw error;
  }
};

export const upgradeSubscription = async (upgradeData) => {
  try {
    const response = await fetch(`${API_BASE}/subscription/upgrade`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upgradeData),
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to upgrade subscription');
    return await response.json();
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
};

export const getAllSubscriptions = async () => {
  try {
    const response = await fetch(`${API_BASE}/subscriptions`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch subscriptions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    throw error;
  }
};
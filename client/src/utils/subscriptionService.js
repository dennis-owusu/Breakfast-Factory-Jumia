// Subscription service for handling API calls related to subscriptions
// Base URL
// const API_BASE = 'https://breakfast-factory-jumia.onrender.com/api/route';
const API_BASE = 'http://localhost:3000/api/route';

export const getUserSubscription = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/subscription/user/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch subscription');
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { success: true, hasActiveSubscription: false, message: 'No active subscription found' };
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const response = await fetch(`${API_BASE}/subscription`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData),
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to create subscription');
    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await fetch(`${API_BASE}/subscription/cancel/${subscriptionId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error((await response.json()).message || 'Failed to cancel subscription');
    return await response.json();
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
import { useState, useCallback } from 'react';
import api from '../utils/api';

/**
 * Custom hook for Paystack payment integration
 * @returns {Object} Paystack payment methods and state
 */
export const usePaystack = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize a Paystack payment
   * @param {Object} paymentData - Payment details
   * @param {string} paymentData.email - Customer email
   * @param {number} paymentData.amount - Amount in GHS
   * @param {string} [paymentData.orderId] - Associated order ID
   * @param {string} [paymentData.callback_url] - Custom callback URL
   * @param {Object} [paymentData.metadata] - Additional metadata
   * @returns {Promise<Object>} Payment initialization response
   */
  const initializePayment = useCallback(async (paymentData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/paystack/initialize', paymentData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment initialization failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify a Paystack payment
   * @param {string} reference - Payment reference
   * @returns {Promise<Object>} Payment verification response
   */
  const verifyPayment = useCallback(async (reference) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/paystack/verify?reference=${reference}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment verification failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Open Paystack payment popup
   * @param {string} authorizationUrl - Paystack authorization URL
   * @returns {Window} Popup window reference
   */
  const openPaymentPopup = useCallback((authorizationUrl) => {
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const popup = window.open(
      authorizationUrl,
      'PaystackPayment',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

    return popup;
  }, []);

  return {
    initializePayment,
    verifyPayment,
    openPaymentPopup,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

export default usePaystack;

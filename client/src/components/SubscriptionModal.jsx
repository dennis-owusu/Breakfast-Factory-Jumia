import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Clock, AlertTriangle } from 'lucide-react';
import { createSubscription, getUserSubscription } from '../utils/subscriptionService';

const SubscriptionModal = () => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [transactionRef, setTransactionRef] = useState(uuidv4());
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  
  // Initialize Paystack payment configuration
  const config = {
    reference: transactionRef,
    email: currentUser?.email || '',
    amount: 30000, // 300 GHS in kobo (smallest currency unit)
    publicKey,
    currency: 'GHS',
  };
  
  // Create the payment initializer
  const initializePayment = usePaystackPayment(config);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedSubscription = localStorage.getItem('subscription');
        const savedLastFetchTime = localStorage.getItem('subscriptionLastFetch');
        const savedAPIResponse = localStorage.getItem('subscriptionAPIResponse');
        
        if (savedSubscription && savedLastFetchTime) {
          const parsedSubscription = JSON.parse(savedSubscription);
          const parsedLastFetchTime = parseInt(savedLastFetchTime, 10);
          const currentTime = Date.now();
          
          // Only use cached data if it's less than 1 hour old
          if (currentTime - parsedLastFetchTime < 60 * 60 * 1000) {
            setSubscription(parsedSubscription);
            setLastFetchTime(parsedLastFetchTime);
            setLoading(false);
            return true; // Data was loaded from cache
          }
        }
        return false; // No valid cached data
      } catch (error) {
        console.error('Error loading saved subscription data:', error);
        return false;
      }
    };
    
    // If we couldn't load from cache, fetch fresh data
    if (!loadSavedData()) {
      fetchSubscription();
    }
  }, []);
  
  // Fetch subscription data
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      if (currentUser?._id) {
        const response = await getUserSubscription(currentUser._id);
        const subscriptionData = response.hasActiveSubscription ? response.subscription : null;
        
        // Save to state
        setSubscription(subscriptionData);
        
        // Save to localStorage for persistence
        if (subscriptionData) {
          localStorage.setItem('subscription', JSON.stringify(subscriptionData));
          // Also store the complete API response to check hasActiveSubscription flag
          localStorage.setItem('subscriptionAPIResponse', JSON.stringify(response));
          const fetchTime = Date.now();
          localStorage.setItem('subscriptionLastFetch', fetchTime.toString());
          setLastFetchTime(fetchTime);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch fresh data when user changes, but only if cache is old or missing
  useEffect(() => {
    const currentTime = Date.now();
    if (currentUser?._id && (!subscription || currentTime - lastFetchTime > 60 * 60 * 1000)) {
      fetchSubscription();
    }
  }, [currentUser, subscription, lastFetchTime]);

  // Update countdown timer
  useEffect(() => {
    if (!subscription) return;

    // Try to load last calculated time from localStorage
    const loadSavedTimeRemaining = () => {
      try {
        const savedTimeRemaining = localStorage.getItem('timeRemaining');
        const savedTimestamp = localStorage.getItem('timeRemainingTimestamp');
        
        if (savedTimeRemaining && savedTimestamp) {
          const parsedTimeRemaining = JSON.parse(savedTimeRemaining);
          const parsedTimestamp = parseInt(savedTimestamp, 10);
          const currentTime = Date.now();
          
          // Only use if saved within the last minute (to avoid stale data)
          if (currentTime - parsedTimestamp < 60 * 1000) {
            // Add the expired property for SubscriptionModal
            const modalTimeRemaining = {
              ...parsedTimeRemaining,
              expired: parsedTimeRemaining.days <= 0 && 
                      parsedTimeRemaining.hours <= 0 && 
                      parsedTimeRemaining.minutes <= 0 && 
                      parsedTimeRemaining.seconds <= 0
            };
            setTimeRemaining(modalTimeRemaining);
          }
        }
      } catch (error) {
        console.error('Error loading saved time remaining:', error);
      }
    };
    
    // Load saved time on initial render
    loadSavedTimeRemaining();

    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const diff = endDate - now;

      if (diff <= 0) {
        // Subscription has expired
        const expiredState = {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        };
        setTimeRemaining(expiredState);
        
        // Save expired state to localStorage
        // We save without the 'expired' property to make it compatible with SubscriptionCountdown
        const storageState = {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
        localStorage.setItem('timeRemaining', JSON.stringify(storageState));
        localStorage.setItem('timeRemainingTimestamp', Date.now().toString());
        return;
      }

      // Calculate time units
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const newTimeRemaining = {
        days,
        hours,
        minutes,
        seconds,
        expired: false
      };
      setTimeRemaining(newTimeRemaining);
      
      // Save to localStorage every 10 seconds to reduce writes
      // We save without the 'expired' property to make it compatible with SubscriptionCountdown
      if (seconds % 10 === 0) {
        const storageState = {
          days,
          hours,
          minutes,
          seconds
        };
        localStorage.setItem('timeRemaining', JSON.stringify(storageState));
        localStorage.setItem('timeRemainingTimestamp', Date.now().toString());
      }
    };

    // Initial calculation
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, [subscription]);

  // Handle payment success
  const handlePaymentSuccess = async (reference) => {
    try {
      setLoading(true);
      
      // First record the payment
      const paymentResponse = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          referenceId: reference.reference,
          userId: currentUser._id,
          amount: 300, // 300 GHS
          phoneNumber: currentUser?.phoneNumber,
          currency: 'GHS',
          payerEmail: currentUser?.email,
          paymentMethod: 'paystack',
          status: 'paid',
        }),
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Failed to record payment');
      }
      
      const paymentData = await paymentResponse.json();
      
      // Then create the subscription
      const subscriptionData = {
        userId: currentUser._id,
        plan: selectedPlan,
        paymentId: paymentData.payment._id,
      };
      
      const response = await createSubscription(subscriptionData);
      setSubscription(response.subscription);
      toast.success(`Successfully subscribed to ${selectedPlan} plan`);
      
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      toast.error(error.message || 'Failed to complete subscription');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment close
  const handlePaymentClose = () => {
    toast.error('Subscription payment is required to continue using the platform');
  };

  // Handle subscription payment
  const handleSubscribe = () => {
    // Generate a fresh transaction reference
    const freshRef = uuidv4();
    setTransactionRef(freshRef);
    
    // Create a fresh config with the new reference
    const freshConfig = {
      reference: freshRef,
      email: currentUser?.email || '',
      amount: 30000, // 300 GHS in kobo
      publicKey,
      currency: 'GHS',
    };
    
    // Initialize payment with fresh config
    const freshInitializePayment = usePaystackPayment(freshConfig);
    
    // Open the payment modal
    freshInitializePayment({
      onSuccess: handlePaymentSuccess,
      onClose: handlePaymentClose,
    });
  };

  // Check if subscription is active and not expired
  const hasActiveSubscription = () => {
    // Developer bypass - if email contains 'dev' or 'admin', always return true
    // This allows developers to bypass subscription requirements
    if (currentUser?.email && (currentUser.email.includes('dev') || currentUser.email === 'kwesimodestygh111@gmail.com' || currentUser.email === 'awesomebridash269@gmail.com')) {
      return true; 
    }
    
    // If there's no subscription data, user doesn't have a subscription
    if (!subscription) return false;
    
    // If the API response indicates success and hasActiveSubscription is true,
    // we should respect that even if our local checks might say otherwise
    try {
      const apiResponseStr = localStorage.getItem('subscriptionAPIResponse');
      if (apiResponseStr) {
        const apiResponse = JSON.parse(apiResponseStr);
        if (apiResponse && apiResponse.success && apiResponse.hasActiveSubscription) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error parsing subscription API response:', error);
      // Continue with regular checks if there's an error
    }
    
    // Otherwise, perform our regular checks
    if (subscription.status !== 'active') return false;
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    return endDate > now;
  };

  // For outlet and admin users, always show the modal if subscription is not active
  // This makes the modal non-dismissible until a successful subscription payment
  // The modal will block access to the dashboard for users with expired subscriptions
  if (hasActiveSubscription()) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl border-2 border-orange-300">
        <h2 className="text-2xl font-bold text-center mb-6 text-orange-600">Subscription Required</h2>
        
        {subscription && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Subscription Status</h3>
            {timeRemaining.expired ? (
              <div className="flex items-center text-red-600">
                <AlertTriangle size={16} className="mr-2" />
                <span>Your subscription has expired</span>
              </div>
            ) : (
              <div>
                <div className="flex items-center text-green-600 mb-2">
                  <Clock size={16} className="mr-2" />
                  <span>Time remaining:</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xl font-bold">{timeRemaining.days}</div>
                    <div className="text-xs text-gray-500">Days</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xl font-bold">{timeRemaining.hours}</div>
                    <div className="text-xs text-gray-500">Hours</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xl font-bold">{timeRemaining.minutes}</div>
                    <div className="text-xs text-gray-500">Minutes</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xl font-bold">{timeRemaining.seconds}</div>
                    <div className="text-xs text-gray-500">Seconds</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-red-600 font-medium mb-2 text-center">
            Access Blocked: Your subscription has expired or is not active.
          </p>
          <p className="text-gray-700 mb-4 text-center">
            You must subscribe to continue using the dashboard and platform features.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-lg text-orange-700 mb-2">Pro Plan - GHS 300/month</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Advanced Analytics</li>
              <li>✓ Unlimited Product Listings</li>
              <li>✓ Priority Support</li>
              <li>✓ Featured Listings</li>
              <li>✓ Custom Branding</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center shadow-md hover:shadow-lg border-b-4 border-orange-700"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                <AlertTriangle size={18} className="mr-2" />
                Subscribe Now to Restore Access - GHS 300/month
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;

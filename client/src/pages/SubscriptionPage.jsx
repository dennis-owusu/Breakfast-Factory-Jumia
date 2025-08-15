import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import { toast } from 'react-toastify';
import { getUserSubscription, createSubscription } from '../utils/subscriptionService';
import { v4 as uuidv4 } from 'uuid';

const SubscriptionPage = () => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [transactionRef, setTransactionRef] = useState(uuidv4());
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const storedEndDate = localStorage.getItem('subscriptionEndDate');
    const storedStatus = localStorage.getItem('subscriptionStatus');
    if (storedEndDate && storedStatus === 'active') {
      const end = new Date(storedEndDate).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff > 0) {
        return {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
          expired: false
        };
      }
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  });
  
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  
  // Initialize Paystack payment configuration
  const config = {
    reference: transactionRef,
    email: currentUser?.email || '',
    amount: selectedPlan === 'pro' ? 30000 : 0, // 300 GHS in kobo (smallest currency unit)
    publicKey,
    currency: 'GHS',
  };
  
  // Create the payment initializer separately
  const initializePayment = usePaystackPayment(config);

  // Check if user is authenticated and has the right role
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Only admin and outlet roles can access subscription page
    if (currentUser.usersRole !== 'admin' && currentUser.usersRole !== 'outlet') {
      navigate('/');
      toast.error('Only admins and outlets can access subscription plans');
      return;
    }
    
    // Fetch user's subscription
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await getUserSubscription(currentUser._id);
        const sub = response.hasActiveSubscription ? response.subscription : null;
        setSubscription(sub);
        if (sub && sub.status === 'active') {
          localStorage.setItem('subscriptionEndDate', sub.endDate);
          localStorage.setItem('subscriptionStatus', sub.status);
          const daysLeft = getDaysRemaining(sub.endDate);
          if (daysLeft <= 7 && daysLeft > 0) {
            toast.warning(`Your subscription is expiring in ${daysLeft} days! Consider renewing.`);
          }
        } else {
          localStorage.removeItem('subscriptionEndDate');
          localStorage.removeItem('subscriptionStatus');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to fetch subscription');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
  }, [currentUser, navigate]);

  // Handle plan selection
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  // Handle subscription payment
  const handleSubscribe = () => {
    if (selectedPlan === 'free') {
      // Free plan doesn't require payment
      handleFreeSubscription();
    } else {
      // Pro plan requires payment
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
    }
  };

  // Handle free subscription
  const handleFreeSubscription = async () => {
    try {
      setLoading(true);
      const subscriptionData = {
        userId: currentUser._id,
        plan: 'free',
      };
      const response = await createSubscription(subscriptionData);
      setSubscription(response.subscription);
      localStorage.setItem('subscriptionEndDate', response.subscription.endDate);
      localStorage.setItem('subscriptionStatus', response.subscription.status);
      toast.success('Successfully subscribed to free plan');
    } catch (error) {
      toast.error(error.message || 'Failed to subscribe to free plan');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (reference) => {
    try {
      setLoading(true);
      
      // First record the payment
      const paymentResponse = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/subscription', {
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
        plan: 'pro',
        paymentId: paymentData.payment._id,
      };
      
      const subscriptionResponse = await createSubscription(subscriptionData);
      setSubscription(subscriptionResponse.subscription);
      localStorage.setItem('subscriptionEndDate', subscriptionResponse.subscription.endDate);
      localStorage.setItem('subscriptionStatus', subscriptionResponse.subscription.status);
      toast.success('Successfully subscribed to pro plan');
      
      // Generate new transaction reference for future transactions
      setTransactionRef(uuidv4());
    } catch (error) {
      toast.error(error.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment close/cancel
  const handlePaymentClose = () => {
    toast('Payment cancelled');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days remaining in subscription
  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Update countdown timer
  useEffect(() => {
    if (!subscription) return;

    const calculateTimeRemaining = () => {
      const now = Date.now();
      const endDate = new Date(subscription.endDate).getTime();
      const diff = endDate - now;

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        localStorage.removeItem('subscriptionEndDate');
        localStorage.setItem('subscriptionStatus', 'expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, expired: false });
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [subscription]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Free Trial Countdown Banner */}
        {subscription && (
          <div className="mb-8 p-4 bg-orange-50 rounded-lg border border-orange-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your Free Trial Status</h2>
            {!timeRemaining.expired ? (
              <div>
                <p className="text-gray-700 mb-3">Your free trial will expire in:</p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <div className="text-3xl font-bold text-orange-600">{timeRemaining.days}</div>
                    <div className="text-sm text-gray-500">Days</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <div className="text-3xl font-bold text-orange-600">{timeRemaining.hours}</div>
                    <div className="text-sm text-gray-500">Hours</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <div className="text-3xl font-bold text-orange-600">{timeRemaining.minutes}</div>
                    <div className="text-sm text-gray-500">Minutes</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <div className="text-3xl font-bold text-orange-600">{timeRemaining.seconds}</div>
                    <div className="text-sm text-gray-500">Seconds</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">Subscribe to our Pro Plan to continue using all features after your trial ends.</p>
              </div>
            ) : (
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-lg font-bold text-red-700">Your free trial has expired!</p>
                <p className="text-gray-700">Subscribe now to restore full access to the platform.</p>
              </div>
            )}
          </div>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Subscription Plans
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Choose the right plan for your business needs
          </p>
        </div>

        {subscription && (
          <div className="mb-12 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-orange-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Current Subscription
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                    {subscription.plan} Plan
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {subscription.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expires On</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(subscription.endDate)}
                    <span className="ml-2 text-xs text-orange-600 font-medium">
                      ({getDaysRemaining(subscription.endDate)} days remaining)
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Features</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="list-disc pl-5 space-y-1">
                      {subscription.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          {/* Free Plan */}
          <div className={`bg-white border rounded-lg shadow-sm divide-y divide-gray-200 ${selectedPlan === 'free' ? 'ring-2 ring-orange-500' : ''}`}>
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Free</h2>
              <p className="mt-4 text-sm text-gray-500">Perfect for getting started with basic features.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">GHS 0</span>
                <span className="text-base font-medium text-gray-500">/2 weeks</span>
              </p>
              <button
                onClick={() => handlePlanSelect('free')}
                className={`mt-8 block w-full bg-${selectedPlan === 'free' ? 'orange-500' : 'white'} border border-orange-500 rounded-md py-2 text-sm font-semibold text-${selectedPlan === 'free' ? 'white' : 'orange-500'} text-center hover:bg-orange-50`}
              >
                {selectedPlan === 'free' ? 'Selected' : 'Select Plan'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Basic Analytics</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Limited Product Listings</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Standard Support</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 line-through">Featured Listings</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 line-through">Custom Branding</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pro Plan */}
          <div className={`bg-white border rounded-lg shadow-sm divide-y divide-gray-200 ${selectedPlan === 'pro' ? 'ring-2 ring-orange-500' : ''}`}>
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
              <p className="mt-4 text-sm text-gray-500">For businesses that need advanced features and support.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">GHS 300</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <button
                onClick={() => handlePlanSelect('pro')}
                className={`mt-8 block w-full bg-${selectedPlan === 'pro' ? 'orange-500' : 'white'} border border-orange-500 rounded-md py-2 text-sm font-semibold text-${selectedPlan === 'pro' ? 'white' : 'orange-500'} text-center hover:bg-orange-50`}
              >
                {selectedPlan === 'pro' ? 'Selected' : 'Select Plan'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Advanced Analytics</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Unlimited Product Listings</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Priority Support</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Featured Listings</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500">Custom Branding</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={handleSubscribe}
            disabled={loading || (subscription?.status === 'active' && selectedPlan === subscription.plan)}
            className="bg-orange-500 text-white px-8 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (subscription?.status === 'active' && selectedPlan === subscription.plan) ? 'Already Subscribed' : selectedPlan === subscription?.plan ? 'Renew Subscription' : subscription?.plan === 'pro' && selectedPlan === 'free' ? 'Downgrade to Free Plan' : 'Upgrade to Pro Plan'}
          </button>
          {subscription?.plan === 'pro' && selectedPlan === 'free' && (
            <p className="mt-4 text-sm text-gray-500">Downgrade will take effect after current subscription expires.</p>
          )}
          {subscription?.plan === 'free' && selectedPlan === 'pro' && (
            <p className="mt-4 text-sm text-gray-500">Upgrade will take effect immediately.</p>
          )}

          {subscription && subscription.status === 'active' && subscription.plan !== selectedPlan && (
            <p className="mt-2 text-sm text-gray-500">
              {selectedPlan === 'free' ? 
                'Downgrading to Free plan will take effect after your current subscription expires.' :
                'Upgrading to Pro plan will take effect immediately.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
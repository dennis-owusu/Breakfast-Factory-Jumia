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
  
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const getAmount = () => {
    switch(selectedPlan) {
      case 'monthly': return 15000;
      case 'bimonthly': return 30000;
      default: return 0;
    }
  };

  const config = {
    reference: transactionRef,
    email: currentUser?.email || '',
    amount: getAmount(),
    publicKey,
    currency: 'GHS',
  };

  const initializePayment = usePaystackPayment(config);

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

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.usersRole !== 'admin' && currentUser.usersRole !== 'outlet') {
      navigate('/');
      toast.error('Only admins and outlets can access subscription plans');
      return;
    }
    
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

  const handlePlanSelect = (plan) => {
    if (subscription?.status === 'active' && subscription.plan === plan) {
      toast.info(`You're already subscribed to the ${plan} plan`);
      return;
    }
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    if (subscription?.status === 'active' && subscription.plan === selectedPlan) {
      toast.error('You already have an active subscription for this plan');
      return;
    }

    if (selectedPlan === 'free') {
      handleFreeSubscription();
    } else {
      const freshRef = uuidv4();
      setTransactionRef(freshRef);
      
      const freshConfig = {
        reference: freshRef,
        email: currentUser?.email || '',
        amount: getAmount(),
        publicKey,
        currency: 'GHS',
      };
      
      const freshInitializePayment = usePaystackPayment(freshConfig);
      
      freshInitializePayment({
        onSuccess: handlePaymentSuccess,
        onClose: handlePaymentClose,
      });
    }
  };

  const handlePaymentSuccess = async (reference) => {
    try {
      setLoading(true);
      
      const paymentResponse = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          referenceId: reference.reference,
          userId: currentUser._id,
          amount: selectedPlan === 'monthly' ? 150 : 300,
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
      
      const subscriptionData = {
        userId: currentUser._id,
        plan: selectedPlan,
        paymentId: paymentData.payment._id,
      };
      
      const subscriptionResponse = await createSubscription(subscriptionData);
      setSubscription(subscriptionResponse.subscription);
      localStorage.setItem('subscriptionEndDate', subscriptionResponse.subscription.endDate);
      localStorage.setItem('subscriptionStatus', subscriptionResponse.subscription.status);
      toast.success(`Successfully subscribed to ${selectedPlan} plan`);
      
      setTransactionRef(uuidv4());
    } catch (error) {
      toast.error(error.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

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

  const handlePaymentClose = () => {
    toast('Payment cancelled');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

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
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {subscription && (
          <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50 shadow-sm dark:shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Your Subscription Status</h2>
            {!timeRemaining.expired ? (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {subscription.plan === 'free' ? 'Your free trial' : 'Your subscription'} will expire in:
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-md text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{timeRemaining.days}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Days</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-md text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{timeRemaining.hours}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hours</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-md text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{timeRemaining.minutes}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Minutes</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-md text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{timeRemaining.seconds}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Seconds</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {subscription.plan === 'free' 
                    ? 'Upgrade to continue using all features after your trial ends.'
                    : 'Renew your subscription to maintain uninterrupted access.'}
                </p>
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {subscription.plan === 'free' ? 'Your free trial has expired!' : 'Your subscription has expired!'}
                </p>
                <p className="text-gray-700 dark:text-gray-300">Subscribe now to restore full access to the platform.</p>
              </div>
            )}
          </div>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl">
            Subscription Plans
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 sm:mt-4">
            Choose the right plan for your business needs
          </p>
        </div>

        {subscription && (
          <div className="mb-12 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg dark:shadow-md">
            <div className="px-4 py-5 sm:px-6 bg-orange-50 dark:bg-orange-900/20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Current Subscription
              </h3>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {subscription.plan} Plan
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${subscription.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
                      {subscription.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires On</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(subscription.endDate)}
                    <span className="ml-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                      ({getDaysRemaining(subscription.endDate)} days remaining)
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {/* Free Plan */}
          <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-md divide-y divide-gray-200 dark:divide-gray-700 ${selectedPlan === 'free' ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''}`}>
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Free</h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Perfect for getting started with basic features</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">GHS 0</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/2 weeks</span>
              </p>
              <button
                onClick={() => handlePlanSelect('free')}
                disabled={subscription?.status === 'active' && subscription.plan === 'free'}
                className={`mt-8 block w-full ${
                  selectedPlan === 'free' ? 'bg-orange-500 dark:bg-orange-600 text-white' : 
                  'bg-white dark:bg-gray-700 border border-orange-500 dark:border-orange-400 text-orange-500 dark:text-orange-400'
                } rounded-md py-2 text-sm font-semibold text-center hover:bg-orange-50 dark:hover:bg-orange-700/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {subscription?.status === 'active' && subscription.plan === 'free' ? 'Current Plan' : selectedPlan === 'free' ? 'Selected' : 'Select Plan'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 tracking-wide uppercase">What's included</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Basic Analytics</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Limited Product Listings</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Standard Support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Monthly Plan */}
          <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-md divide-y divide-gray-200 dark:divide-gray-700 ${selectedPlan === 'monthly' ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''}`}>
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Monthly</h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">For growing businesses</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">GHS 150</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/month</span>
              </p>
              <button
                onClick={() => handlePlanSelect('monthly')}
                disabled={subscription?.status === 'active' && subscription.plan === 'monthly'}
                className={`mt-8 block w-full ${
                  selectedPlan === 'monthly' ? 'bg-orange-500 dark:bg-orange-600 text-white' : 
                  'bg-white dark:bg-gray-700 border border-orange-500 dark:border-orange-400 text-orange-500 dark:text-orange-400'
                } rounded-md py-2 text-sm font-semibold text-center hover:bg-orange-50 dark:hover:bg-orange-700/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {subscription?.status === 'active' && subscription.plan === 'monthly' ? 'Current Plan' : selectedPlan === 'monthly' ? 'Selected' : 'Select Plan'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 tracking-wide uppercase">What's included</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Advanced Analytics</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Unlimited Products</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Priority Support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bimonthly Plan */}
          <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-md divide-y divide-gray-200 dark:divide-gray-700 ${selectedPlan === 'bimonthly' ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''}`}>
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Bimonthly</h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Best value for established businesses</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">GHS 300</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/2 months</span>
              </p>
              <button
                onClick={() => handlePlanSelect('bimonthly')}
                disabled={subscription?.status === 'active' && subscription.plan === 'bimonthly'}
                className={`mt-8 block w-full ${
                  selectedPlan === 'bimonthly' ? 'bg-orange-500 dark:bg-orange-600 text-white' : 
                  'bg-white dark:bg-gray-700 border border-orange-500 dark:border-orange-400 text-orange-500 dark:text-orange-400'
                } rounded-md py-2 text-sm font-semibold text-center hover:bg-orange-50 dark:hover:bg-orange-700/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {subscription?.status === 'active' && subscription.plan === 'bimonthly' ? 'Current Plan' : selectedPlan === 'bimonthly' ? 'Selected' : 'Select Plan'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 tracking-wide uppercase">What's included</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">All Monthly features</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Featured Listings</span>
                </li>
                <li className="flex space-x-3">
                  <svg className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Custom Branding</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={handleSubscribe}
            disabled={loading || (subscription?.status === 'active' && selectedPlan === subscription.plan)}
            className="bg-orange-500 dark:bg-orange-600 text-white px-8 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-orange-600 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 
             (subscription?.status === 'active' && selectedPlan === subscription.plan) ? 'Current Plan Active' : 
             selectedPlan === subscription?.plan ? 'Renew Subscription' : 
             `Subscribe to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`}
          </button>

          {subscription && subscription.status === 'active' && subscription.plan !== selectedPlan && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {selectedPlan === 'free' ? 
                'Downgrading to Free plan will take effect after your current subscription expires.' :
                `Upgrading to ${selectedPlan} plan will take effect immediately.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
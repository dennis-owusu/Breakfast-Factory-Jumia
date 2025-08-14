import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getUserSubscription } from '../utils/subscriptionService';

const SubscriptionCountdown = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [subscription, setSubscription] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        if (currentUser?._id) {
          const response = await getUserSubscription(currentUser._id);
          setSubscription(response.hasActiveSubscription ? response.subscription : null);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [currentUser]);

  // Update countdown timer
  useEffect(() => {
    if (!subscription) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const diff = endDate - now;

      if (diff <= 0) {
        // Subscription has expired
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Calculate time units
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    // Initial calculation
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, [subscription]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2 bg-gray-100 rounded-md">
        <div className="animate-pulse h-4 w-24 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm font-medium">
        No active subscription
      </div>
    );
  }

  // Determine color based on remaining time
  const getColorClass = () => {
    const { days } = timeRemaining;
    if (days <= 0) return 'bg-red-100 text-red-700';
    if (days <= 3) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className={`p-3 rounded-md ${getColorClass()}`}>
      <div className="text-xs uppercase font-semibold mb-1">Subscription Expires In:</div>
      <div className="flex items-center space-x-2 text-sm font-bold">
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeRemaining.days}</span>
          <span className="text-xs">Days</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeRemaining.hours.toString().padStart(2, '0')}</span>
          <span className="text-xs">Hours</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeRemaining.minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs">Mins</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg">{timeRemaining.seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs">Secs</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCountdown;
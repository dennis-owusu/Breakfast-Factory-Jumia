import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, BarChart2, User, Settings, DollarSign, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, CreditCard, Star, RefreshCw, Menu, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../Sidebar';
import DashboardSearch from '../DashboardSearch';
import axios from 'axios';

const DashboardLayout = ({ children }) => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const role = currentUser?.usersRole || 'user';
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileCountdownExpanded, setIsMobileCountdownExpanded] = useState(true);
  const [isDesktopCountdownExpanded, setIsDesktopCountdownExpanded] = useState(true);

  const getSidebarLinks = () => {
    if (role === 'outlet') {
      return [
        { to: '/outlet/dashboard', icon: <BarChart2 size={20} />, label: 'Dashboard' },
        { to: '/outlet/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
        { to: '/outlet/sales', icon: <DollarSign size={20} />, label: 'Sales' },
        { to: '/outlet/transactions', icon: <CreditCard size={20} />, label: 'Transactions' },
        { to: '/outlet/sell', icon: <CreditCard size={20} />, label: 'Sell' },
        { to: '/outlet/products', icon: <Package size={20} />, label: 'Products' },
        { to: '/outlet/restock', icon: <RefreshCw size={20} />, label: 'Restock' },
        { to: '/outlet/orders', icon: <ShoppingBag size={20} />, label: 'Orders' },
        { to: '/outlet/subscription', icon: <Star size={20} />, label: 'Subscription' },
        { to: '/outlet/profile', icon: <User size={20} />, label: 'Profile' },
      ];
    } else if (role === 'admin') {
      return [
        { to: '/admin/dashboard', icon: <BarChart2 size={20} />, label: 'Dashboard' },
        { to: '/admin/products', icon: <Package size={20} />, label: 'Products' },
        { to: '/admin/orders', icon: <ShoppingBag size={20} />, label: 'Orders' },
        { to: '/admin/users', icon: <User size={20} />, label: 'Users' },
        { to: '/admin/outlets', icon: <Settings size={20} />, label: 'Outlets' },
        { to: '/admin/categories', icon: <Settings size={20} />, label: 'Categories' },
        { to: '/admin/restock', icon: <RefreshCw size={20} />, label: 'Restock Requests' },
        { to: '/admin/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
        { to: '/admin/sales', icon: <DollarSign size={20} />, label: 'Sales Reports' },
        { to: '/admin/subscription', icon: <Star size={20} />, label: 'Subscription' },
      ];
    } else {
      return [
        { to: '/user/dashboard', icon: <BarChart2 size={20} />, label: 'Dashboard' },
        { to: '/user/orders', icon: <ShoppingBag size={20} />, label: 'Orders' },
        { to: '/user/profile', icon: <User size={20} />, label: 'Profile' },
      ];
    }
  };

  const getTitle = () => {
    if (role === 'outlet') {
      return currentUser?.storeName || 'Outlet Dashboard';
    } else if (role === 'admin') {
      return 'Admin Dashboard';
    } else {
      return 'User Dashboard';
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      if (role === 'outlet' || role === 'admin') {
        try {
          const res = await axios.get(`https://breakfast-factory-jumia.onrender.com/api/route/subscription/user/${currentUser._id}`, {
            headers: { Authorization: `Bearer ${currentUser.token}` }
          });
          setSubscription(res.data.subscription);
        } catch (err) {
          console.error('Failed to fetch subscription', err);
        }
      }
    };
    fetchSubscription();
  }, [role, currentUser]);

  useEffect(() => {
    if (subscription) {
      const calculateRemainingTime = () => {
        const now = new Date();
        const end = new Date(subscription.endDate);
        const diff = end - now;
        
        if (diff <= 0) {
          setRemainingTime({
            expired: true,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
          });
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setRemainingTime({
          expired: false,
          days,
          hours,
          minutes,
          seconds,
          formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
        });
      };
      
      calculateRemainingTime();
      const timer = setInterval(calculateRemainingTime, 1000); // Update every second for countdown
      return () => clearInterval(timer);
    }
  }, [subscription]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        links={getSidebarLinks()} 
        title={getTitle()} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="flex-1 overflow-auto md:pl-64 transition-all duration-300 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 md:hidden p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-4 text-lg font-semibold text-gray-800 dark:text-gray-200">{getTitle()}</h1>
          </div>
          <DashboardSearch />
        </div>

        {/* Subscription Countdown Banner - Mobile - Always visible for better awareness */}
        {(role === 'outlet' || role === 'admin') && subscription && (
          <div className="md:hidden sticky top-16 z-10 p-3 border-t border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900">
            <div className={`rounded-lg p-3 ${remainingTime?.expired ? 'bg-red-50' : remainingTime?.days < 3 ? 'bg-yellow-50' : 'bg-green-50'}`}
        >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Clock size={16} className={`mr-2 ${remainingTime?.expired ? 'text-red-500' : remainingTime?.days < 3 ? 'text-yellow-500' : 'text-orange-500'}`} />
                  <span className="font-bold text-gray-800">
                    {remainingTime?.expired ? 'Free Trial Expired' : 'Free Trial Remaining:'}
                  </span>
                </div>
                <button onClick={() => setIsMobileCountdownExpanded(!isMobileCountdownExpanded)}>
                  {isMobileCountdownExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {!remainingTime?.expired && (
                  <span className={`text-xs font-bold px-2 py-1 rounded ${remainingTime?.days < 3 ? 'bg-red-100 text-red-800' : remainingTime?.days < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {subscription.plan.toUpperCase()} PLAN
                  </span>
                )}
              </div>
              {isMobileCountdownExpanded && (
                <>
                  {!remainingTime?.expired ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xl font-bold">{remainingTime?.days}</div>
                        <div className="text-xs text-gray-500">Days</div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xl font-bold">{remainingTime?.hours}</div>
                        <div className="text-xs text-gray-500">Hours</div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xl font-bold">{remainingTime?.minutes}</div>
                        <div className="text-xs text-gray-500">Mins</div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xl font-bold">{remainingTime?.seconds}</div>
                        <div className="text-xs text-gray-500">Secs</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-red-600">
                        <AlertTriangle size={16} className="mr-2" />
                        <span className="font-bold">Free Trial Expired - Payment Required</span>
                      </div>
                      <a 
                        href="/subscription" 
                        className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded-md shadow-sm transition-colors"
                      >
                        Subscribe Now
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Desktop Header with Subscription Countdown */}
        <div className="hidden md:block sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mr-4">{getTitle()}</h1>
              <DashboardSearch />
            </div>
            
            {/* Subscription Status for Desktop - Enhanced visibility */}
            {(role === 'outlet' || role === 'admin') && subscription && (
              <div className="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-900 rounded-lg border border-orange-200 dark:border-orange-700 shadow-sm">
                <button onClick={() => setIsDesktopCountdownExpanded(!isDesktopCountdownExpanded)}>
                  {isDesktopCountdownExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isDesktopCountdownExpanded && (
                  <>
                    {!remainingTime?.expired ? (
                      <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center px-2">
                          <Clock size={16} className="mr-2 text-orange-500" />
                          <span className="text-sm font-bold text-gray-700">FREE TRIAL REMAINING:</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className={`px-3 py-1 rounded-md text-sm font-bold ${remainingTime?.days < 3 ? 'bg-red-100 text-red-800' : remainingTime?.days < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {remainingTime?.days}d
                          </div>
                          <div className={`px-3 py-1 rounded-md text-sm font-bold ${remainingTime?.days < 3 ? 'bg-red-100 text-red-800' : remainingTime?.days < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {remainingTime?.hours}h
                          </div>
                          <div className={`px-3 py-1 rounded-md text-sm font-bold ${remainingTime?.days < 3 ? 'bg-red-100 text-red-800' : remainingTime?.days < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {remainingTime?.minutes}m
                          </div>
                          <div className={`px-3 py-1 rounded-md text-sm font-bold ${remainingTime?.days < 3 ? 'bg-red-100 text-red-800' : remainingTime?.days < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {remainingTime?.seconds}s
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center px-3 py-1 rounded-md bg-red-100 text-red-800">
                          <AlertTriangle size={16} className="mr-2" />
                          <span className="font-bold">Free Trial Expired - Payment Required</span>
                        </div>
                        <a 
                          href="/subscription" 
                          className="text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded-md shadow-sm transition-colors"
                        >
                          Subscribe Now
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
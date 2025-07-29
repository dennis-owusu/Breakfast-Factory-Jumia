import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, BarChart2, User, Settings, DollarSign, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, CreditCard, Star, RefreshCw, Menu, Clock, AlertTriangle } from 'lucide-react';
import Sidebar from '../Sidebar';
import axios from 'axios';

const DashboardLayout = ({ children }) => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const role = currentUser?.usersRole || 'user';
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          setRemainingTime('Expired');
          navigate(`/${role}/subscription`);
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setRemainingTime(`${days}d ${hours}h ${minutes}m`);
      };
      
      calculateRemainingTime();
      const timer = setInterval(calculateRemainingTime, 60000);
      return () => clearInterval(timer);
    }
  }, [subscription, navigate, role]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        links={getSidebarLinks()} 
        title={getTitle()} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="flex-1 overflow-auto md:pl-64 transition-all duration-300">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white md:hidden p-4 shadow-sm flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-800">{getTitle()}</h1>
          {(role === 'outlet' || role === 'admin') && remainingTime && (
            <div className={`ml-auto flex items-center text-sm px-3 py-1 rounded-full ${
              remainingTime === 'Expired' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              <Clock size={16} className="mr-1" />
              {remainingTime}
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block sticky top-0 z-10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
            {(role === 'outlet' || role === 'admin') && remainingTime && (
              <div className={`flex items-center text-sm px-4 py-2 rounded-full ${
                remainingTime === 'Expired' 
                  ? 'bg-red-100 text-red-800' 
                  : remainingTime.includes('d') && parseInt(remainingTime) <= 3
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                <Clock size={16} className="mr-2" />
                <span className="font-medium">
                  {remainingTime === 'Expired' ? 'Subscription Expired' : `Trial: ${remainingTime} left`}
                </span>
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
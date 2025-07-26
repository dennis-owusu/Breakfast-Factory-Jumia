import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, Package, BarChart2, User, Settings, DollarSign, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, CreditCard, Star, RefreshCw, Menu } from 'lucide-react';
import Sidebar from '../Sidebar';

const DashboardLayout = ({ children }) => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const role = currentUser?.usersRole || 'user';
  
  // Define sidebar links based on user role
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

  // Get title based on role
  const getTitle = () => {
    if (role === 'outlet') {
      return currentUser?.storeName || 'Outlet Dashboard';
    } else if (role === 'admin') {
      return 'Admin Dashboard';
    } else {
      return 'User Dashboard';
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="sticky top-0 z-10 bg-white md:hidden p-4 shadow-sm flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-800">{getTitle()}</h1>
        </div>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
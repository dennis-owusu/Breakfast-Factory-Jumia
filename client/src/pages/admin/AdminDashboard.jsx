import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  ShoppingBag, 
  Store, 
  DollarSign, 
  Package, 
  AlertTriangle,
  BarChart2,
  ShoppingCart,                                                                                                                                                                                                                                                                                                                                                                                                                                               
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { formatPrice, formatDate } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import AIQuery from '../../components/ui/AIQuery';

// Fetch dashboard stats from API
const fetchDashboardStats = async (headers) => {
  try {
    const response = await fetch('/api/route/dashboard/stats', {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.user);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Set headers with authentication token
        const headers = {
          'Content-Type': 'application/json',
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        };
        
        const data = await fetchDashboardStats(headers);
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err.message);
        setError('Failed to load dashboard statistics. Please try again later.');
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardStats();
  }, [user?.token]);

  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back, {user?.name || 'Admin'}! Here's what's happening with your store today.
          </p>
        </div>

        {/* AI Query Section */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Ask AI Assistant</h2>
            <AIQuery />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Sales */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Sales</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{formatPrice(stats.totalSales)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/sales" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">
                  View all sales
                </Link>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-md p-3">
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.totalOrders.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/orders" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">
                  View all orders
                </Link>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-md p-3">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Users</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.totalUsers.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/users" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">
                  View all users
                </Link>
              </div>
            </div>
          </div>

          {/* Total Outlets */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-md p-3">
                  <Store className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Outlets</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.totalOutlets.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/outlets" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">
                  View all outlets
                </Link>
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-md p-3">
                  <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Products</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.totalProducts.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/products" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">
                  View all products
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900/30 rounded-md p-3">
                  <ShoppingCart className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.pendingOrders.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/orders?status=pending" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">
                  View pending orders
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Outlets */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-md p-3">
                  <UserCheck className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Outlets</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.pendingOutlets.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/outlets?status=pending" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">
                  View pending outlets
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/products" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Manage Products</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, or remove products</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
          
          <Link to="/admin/orders" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <ShoppingBag className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Manage Orders</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and update order status</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
          
          <Link to="/admin/analytics" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <BarChart2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Analytics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View sales and performance data</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
          
          <Link to="/admin/sales" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sales Reports</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and download sales reports</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
          
          <Link to="/admin/categories" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Manage Categories</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, or remove categories</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
          
          <Link to="/admin/users" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Manage Users</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage user accounts</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
          
          <Link to="/admin/outlets" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <Store className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Manage Outlets</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage outlets</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Quick Actions
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Common tasks you can perform right now
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link 
                to="/admin/products/new" 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
              >
                <Package className="h-5 w-5 mr-2" />
                Add New Product
              </Link>
              <Link 
                to="/admin/orders" 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                View Orders
              </Link>
              <Link 
                to="/admin/users" 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <Users className="h-5 w-5 mr-2" />
                Manage Users
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

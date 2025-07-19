import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Users, 
  ShoppingBag, 
  Store, 
  DollarSign, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  BarChart2,
  ShoppingCart,
  UserCheck
} from 'lucide-react';
import { formatPrice, formatDate } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import AIQuery from '../../components/ui/AIQuery';

// This would be imported from an API utility file in a real app
const fetchDashboardStats = async () => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalSales: 12500000,
        totalOrders: 1250,
        totalUsers: 3500,
        totalOutlets: 120,
        totalProducts: 8500,
        pendingOrders: 85,
        pendingOutlets: 12,
        recentOrders: [
          {
            _id: 'ord123',
            orderNumber: 'ORD-100123',
            customer: { name: 'John Doe' },
            totalAmount: 45000,
            status: 'processing',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 'ord124',
            orderNumber: 'ORD-100124',
            customer: { name: 'Jane Smith' },
            totalAmount: 78500,
            status: 'pending',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 'ord125',
            orderNumber: 'ORD-100125',
            customer: { name: 'Robert Johnson' },
            totalAmount: 125000,
            status: 'delivered',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 'ord126',
            orderNumber: 'ORD-100126',
            customer: { name: 'Emily Davis' },
            totalAmount: 35000,
            status: 'shipped',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 'ord127',
            orderNumber: 'ORD-100127',
            customer: { name: 'Michael Wilson' },
            totalAmount: 92500,
            status: 'processing',
            createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
          }
        ],
        newOutlets: [
          {
            _id: 'out123',
            name: 'Tech Haven',
            owner: { name: 'David Chen' },
            status: 'pending',
            productsCount: 0,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 'out124',
            name: 'Fashion Forward',
            owner: { name: 'Sarah Kim' },
            status: 'pending',
            productsCount: 0,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 'out125',
            name: 'Home Essentials',
            owner: { name: 'James Brown' },
            status: 'active',
            productsCount: 12,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        salesByCategory: [
          { name: 'Electronics', value: 4500000 },
          { name: 'Fashion', value: 3200000 },
          { name: 'Home & Kitchen', value: 2100000 },
          { name: 'Beauty & Personal Care', value: 1500000 },
          { name: 'Books & Media', value: 1200000 }
        ]
      });
    }, 1000);
  });
};

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardStats();
  }, []);

  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.name || 'Admin'}! Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Sales */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{formatPrice(stats.totalSales)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/sales" className="font-medium text-orange-600 hover:text-orange-500">
                  View all sales
                </Link>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalOrders.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/orders" className="font-medium text-orange-600 hover:text-orange-500">
                  View all orders
                </Link>
              </div>
            </div>
          </div>

          {/* Total Users */}

        {/* AI Query Section */}
        <div className="mt-8">
          <AIQuery />
        </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/users" className="font-medium text-orange-600 hover:text-orange-500">
                  View all users
                </Link>
              </div>
            </div>
          </div>

          {/* Total Outlets */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <Store className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Outlets</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalOutlets.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/outlets" className="font-medium text-orange-600 hover:text-orange-500">
                  View all outlets
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Total Products */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <Package className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalProducts.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/products" className="font-medium text-orange-600 hover:text-orange-500">
                  View all products
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <ShoppingCart className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.pendingOrders.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/orders?status=pending" className="font-medium text-orange-600 hover:text-orange-500">
                  View pending orders
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Outlets */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <UserCheck className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Outlets</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.pendingOutlets.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/admin/outlets?status=pending" className="font-medium text-orange-600 hover:text-orange-500">
                  View pending outlets
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest orders across all outlets</p>
              </div>
              <Link to="/admin/orders" className="text-sm font-medium text-orange-600 hover:text-orange-500">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600 hover:text-orange-500">
                        <Link to={`/admin/orders/${order._id}`}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Outlets */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">New Outlets</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Recently registered outlets</p>
              </div>
              <Link to="/admin/outlets" className="text-sm font-medium text-orange-600 hover:text-orange-500">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outlet
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.newOutlets.map((outlet) => (
                    <tr key={outlet._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600 hover:text-orange-500">
                        <Link to={`/admin/outlets/${outlet._id}`}>
                          {outlet.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {outlet.owner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(outlet.status)}`}>
                          {outlet.status.charAt(0).toUpperCase() + outlet.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {outlet.productsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(outlet.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Sales by Category</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Distribution of sales across product categories</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {stats.salesByCategory.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    <div className="text-sm font-medium text-gray-500">{formatPrice(category.value)}</div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-orange-500 h-2.5 rounded-full" 
                      style={{ width: `${(category.value / stats.totalSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link to="/admin/analytics" className="font-medium text-orange-600 hover:text-orange-500 flex items-center">
                <BarChart2 className="h-4 w-4 mr-1" />
                View detailed analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
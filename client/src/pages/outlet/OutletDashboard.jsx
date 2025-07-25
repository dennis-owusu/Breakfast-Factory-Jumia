import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, BarChart2, Settings, ChevronRight, DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { toast } from 'react-hot-toast';
import AIQuery from '../../components/ui/AIQuery';

// Fetch outlet dashboard statistics from the API

const OutletDashboard = () => {
  const { currentUser } = useSelector((state) => state.user);
  const outlet = currentUser || {};
  
  const [stats, setStats] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Current outlet object:', outlet);
        console.log('Outlet ID being used:', outlet._id);
        
        // Set headers with authentication token
        const headers = {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
        };
        
        // Fetch all orders for the outlet 
        const ordersResponse = await fetch(`/api/route/getOutletOrders/${outlet._id}`, { headers });
        if (!ordersResponse.ok) {
          throw new Error(`HTTP error ${ordersResponse.status}: ${ordersResponse.statusText}`);
        }
        const ordersData = await ordersResponse.json();
        console.log('Orders data:', ordersData);
        console.log('Orders data structure:', JSON.stringify(ordersData));
        
        // Fetch analytics summary for the outlet
        const analyticsResponse = await fetch(`/api/route/analytics?period=monthly&outletId=${outlet._id}`, { headers });
        if (!analyticsResponse.ok) {
          throw new Error(`HTTP error ${analyticsResponse.status}: ${analyticsResponse.statusText}`);
        }
        const analyticsData = await analyticsResponse.json();
        console.log('Analytics data:', analyticsData);
        
        // Combine data for dashboard
        setStats({
          totalSales: analyticsData.data.summaryData.totalSales,
          totalOrders: analyticsData.data.summaryData.totalOrders,
          totalProducts: analyticsData.data.summaryData.totalProducts,
          pendingOrders: ordersData.orders.filter(order => order.status === 'pending').length,
          recentOrders: ordersData.orders.slice(0, 5),
          topProducts: analyticsData.data.topProducts
        });
        setAllOrders(ordersData.orders);
      } catch (err) {
        console.error('Failed to load dashboard data:', err.message);
        setError('Failed to load dashboard data. Please try again later.');
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (outlet && outlet._id) {
      fetchDashboardStats();
    } else {
      setError('No outlet found. Please ensure you are logged in.');
      setIsLoading(false);
    }
  }, [outlet._id, currentUser?.token]);
  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <button 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {outlet.name || 'Outlet'} Dashboard
            </h1>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/outlet/product/new"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Add New Product
            </Link>
          </div>
        </div>
        
        {/* AI Query Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ask AI Assistant</h2>
            <AIQuery />
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Sales Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{formatPrice(stats?.totalSales || 0)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/sales" className="font-medium text-orange-500 hover:text-orange-600">
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          {/* Total Orders Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <ShoppingBag className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats?.totalOrders || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/orders" className="font-medium text-orange-500 hover:text-orange-600">
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          {/* Total Products Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <Package className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats?.totalProducts || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/products" className="font-medium text-orange-500 hover:text-orange-600">
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          {/* Pending Orders Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats?.pendingOrders || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/orders?status=pending" className="font-medium text-orange-500 hover:text-orange-600">
                  View all
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
          <Link to="/outlet/products" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <Package className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Products</h3>
                <p className="text-sm text-gray-500">Add, edit, or remove products</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
          
          <Link to="/outlet/orders" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <ShoppingBag className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Orders</h3>
                <p className="text-sm text-gray-500">View and update order status</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
          
          <Link to="/outlet/sell" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Sell</h3>
                <p className="text-sm text-gray-500">Process in-store sales</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
          
          <Link to="/outlet/analytics" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <BarChart2 className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">View sales and performance data</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
          <Link to="/outlet/categories" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <Package className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Categories</h3>
                <p className="text-sm text-gray-500">Add, edit, or remove categories</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
              <Link to="/outlet/orders" className="text-sm font-medium text-orange-500 hover:text-orange-600">
                View all
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={order.products && order.products[0]?.product?.images?.[0] || 'https://via.placeholder.com/150'} 
                                alt="" 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                              <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.user?.name || order.userInfo?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(order.totalPrice || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/outlet/orders/${order._id}`} className="text-orange-500 hover:text-orange-600">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Top Products */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Top Products</h3>
              <Link to="/outlet/analytics" className="text-sm font-medium text-orange-500 hover:text-orange-600">
                View all
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.topProducts && stats.topProducts.length > 0 ? (
                    stats.topProducts.map((product) => (
                      <tr key={product.id || product._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={product.image || 'https://via.placeholder.com/150'} 
                                alt="" 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.units || 0} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(product.sales || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/outlet/products/${product.id || product._id}/edit`} className="text-orange-500 hover:text-orange-600">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No top products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Transaction History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {allOrders && allOrders.length > 0 ? (
                  [...allOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.user?.name || order.userInfo?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{order.user?.email || order.userInfo?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {order.products && order.products.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                              <img src={item.product?.images?.[0] || 'https://via.placeholder.com/50'} 
                                   alt={item.product?.name || ''} 
                                   className="h-12 w-12 rounded-lg object-cover" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} @ {formatPrice(item.product?.price || 0)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.paymentMethod || 'Cash on Delivery'}</div>
                        <div className="text-xs text-gray-500">{order.paymentStatus || 'Pending'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-orange-600">{formatPrice(order.totalPrice || 0)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50">
                      No transaction history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutletDashboard;
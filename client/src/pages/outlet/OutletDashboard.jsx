import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, BarChart2, ChevronRight, DollarSign, TrendingUp, Users, CreditCard, Bot, MessageSquare } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { toast } from 'react-hot-toast';
import AIQuery from '../../components/ui/AIQuery';
import AIChatModal from '../../components/AIChatModal';
import { saveAs } from 'file-saver';
import io from 'socket.io-client';


// Fetch outlet dashboard statistics from the API

const OutletDashboard = () => {
  const { currentUser } = useSelector((state) => state.user);
  const outlet = currentUser || {};
  
  const [stats, setStats] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/dashboard/outlet/${outlet._id}/daily-report`);
      if (!res.ok) {
        throw new Error('Failed to fetch daily report');
      }
      const data = await res.json();

      // Convert JSON to CSV
      const { summary, report } = data;
      const csvRows = [];
      
      // Add summary headers and data
      csvRows.push(['Daily Sales Report Summary']);
      csvRows.push(['Outlet', summary.outletName]);
      csvRows.push(['Date', summary.date]);
      csvRows.push(['Total Sales', formatPrice(summary.totalSales)]);
      csvRows.push(['Total Units Sold', summary.totalUnitsSold]);
      csvRows.push(['']); // Spacer

      // Add report headers
      const headers = ['Product Name', 'Quantity Sold', 'Total Value', 'Current Stock', 'Reorder Point'];
      csvRows.push(headers.join(','));

      // Add report data
      for (const item of report) {
        const values = [
          `"${item.productName}"`,
          item.totalQuantity,
          formatPrice(item.totalValue),
          item.currentStock,
          item.reorderPoint
        ];
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `daily-sales-report-${summary.date}.csv`);

    } catch (error) {
      console.error('Download failed', error);
      toast.error('Failed to download report.');
    } finally {
      setIsDownloading(false);
    }
  };
  
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
        const ordersResponse = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/getOutletOrders/${outlet._id}`, { headers });
        if (!ordersResponse.ok) {
          throw new Error(`HTTP error ${ordersResponse.status}: ${ordersResponse.statusText}`);
        }
        const ordersData = await ordersResponse.json();
        console.log('Orders data:', ordersData);
        console.log('Orders data structure:', JSON.stringify(ordersData));
        
        // Fetch analytics summary for the outlet
        const analyticsResponse = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/analytics?period=monthly&outletId=${outlet._id}`, { headers });
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

  // Socket.IO for real-time low stock alerts
  useEffect(() => {
    if (currentUser && currentUser.token) {
      const socket = io('http://localhost:3000', {
        auth: { token: currentUser.token }
      });

      socket.on('connect', () => {
        console.log('Socket connected for outlet dashboard');
      });

      socket.on('lowStockAlert', (data) => {
        toast.warning(data.message);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected from outlet dashboard');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [currentUser]);
  
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }
   
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
              {outlet.name || 'Outlet'} Dashboard
            </h1>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isDownloading ? 'Downloading...' : 'Download Daily Report'}
            </button>
            <Link
              to="/outlet/product/new"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Add New Product
            </Link>
            <button
               onClick={() => setIsChatOpen(true)}
               className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
             >
               Chat with AI
             </button>
          </div>
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
          {/* Total Sales Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Sales</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{formatPrice(stats?.totalSales || 0)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/sales" className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          {/* Total Orders Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                  <ShoppingBag className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats?.totalOrders || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/orders" className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          {/* Total Products Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                  <Package className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Products</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats?.totalProducts || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/products" className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          {/* Pending Orders Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats?.pendingOrders || 0}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link to="/outlet/orders?status=pending" className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                  View all
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
          <Link to="/outlet/products" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <Package className="h-6 w-6 text-orange-500" />
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
          
          <Link to="/outlet/orders" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <ShoppingBag className="h-6 w-6 text-orange-500" />
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
          
          <Link to="/outlet/sell" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sell</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Process in-store sales</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </Link>
          
          <Link to="/outlet/analytics" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <BarChart2 className="h-6 w-6 text-orange-500" />
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
          <Link to="/outlet/categories" className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                <Package className="h-6 w-6 text-orange-500" />
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
        </div>
        
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Recent Orders</h3>
              <Link to="/outlet/orders" className="text-sm font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                View all
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{order.user?.name || order.userInfo?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatPrice(order.totalPrice || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/outlet/orders/${order._id}`} className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Top Products */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Top Products</h3>
              <Link to="/outlet/analytics" className="text-sm font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                View all
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sold</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {stats?.topProducts && stats.topProducts.length > 0 ? (
                    stats.topProducts.map((product, index) => (
                      <tr key={product.id || product._id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                           {/*  <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                                alt="" 
                              />
                            </div> */}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.units || 0} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatPrice(product.sales || 0)}
                        </td>
                       {/*  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/outlet/products/${product.id || product._id}/edit`} className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
                            Edit
                          </Link>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
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
        <div className="mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/10 dark:to-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Transaction History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Order</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Products</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Payment</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {allOrders && allOrders.length > 0 ? (
                  [...allOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.user?.name || order.userInfo?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{order.user?.email || order.userInfo?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {order.products && order.products.map((item, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <img src={item.product?.images?.[0] || 'https://via.placeholder.com/50'} 
                                   alt={item.product?.name || ''} 
                                   className="h-6 w-6 rounded object-cover" />
                              <span className="ml-1 text-gray-600 dark:text-gray-300">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.paymentMethod || 'Cash on Delivery'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{order.paymentStatus || 'Pending'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-orange-600 dark:text-orange-400">{formatPrice(order.totalPrice || 0)}</div>
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
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                      No transaction history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* AI Chat Modal - Always rendered as an overlay */}
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all duration-300 flex items-center justify-center z-40 group"
        aria-label="Chat with AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Chat with AI
        </span>
      </button>
    </div>
  );
};

export default OutletDashboard;
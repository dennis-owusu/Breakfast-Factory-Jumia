import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Calendar,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { formatPrice } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';

// This would be imported from an API utility file in a real app
const fetchAnalyticsData = async (period) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate sales data
      let salesData = [];
      let categoryData = [];
      let topProducts = [];
      let topOutlets = [];
      let userGrowthData = [];
      
      // Different data based on period
      if (period === 'daily') {
        // Last 7 days
        salesData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: Math.floor(Math.random() * 500000) + 100000,
            orders: Math.floor(Math.random() * 100) + 20
          };
        });
      } else if (period === 'weekly') {
        // Last 4 weeks
        salesData = Array.from({ length: 4 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - ((3 - i) * 7));
          return {
            date: `Week ${i + 1}`,
            sales: Math.floor(Math.random() * 2000000) + 500000,
            orders: Math.floor(Math.random() * 500) + 100
          };
        });
      } else if (period === 'monthly') {
        // Last 6 months
        salesData = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short' }),
            sales: Math.floor(Math.random() * 8000000) + 2000000,
            orders: Math.floor(Math.random() * 2000) + 500
          };
        });
      } else { // yearly
        // Last 12 months
        salesData = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short' }),
            sales: Math.floor(Math.random() * 10000000) + 3000000,
            orders: Math.floor(Math.random() * 3000) + 1000
          };
        });
      }
      
      // Category data
      categoryData = [
        { name: 'Electronics', value: Math.floor(Math.random() * 5000000) + 1000000 },
        { name: 'Fashion', value: Math.floor(Math.random() * 4000000) + 1000000 },
        { name: 'Home & Kitchen', value: Math.floor(Math.random() * 3000000) + 1000000 },
        { name: 'Beauty', value: Math.floor(Math.random() * 2000000) + 500000 },
        { name: 'Books', value: Math.floor(Math.random() * 1000000) + 300000 },
        { name: 'Sports', value: Math.floor(Math.random() * 1500000) + 400000 }
      ];
      
      // Top products
      topProducts = Array.from({ length: 5 }, (_, i) => ({
        id: `product${i + 1}`,
        name: `Product ${i + 1}`,
        category: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Books'][Math.floor(Math.random() * 5)],
        sales: Math.floor(Math.random() * 1000000) + 200000,
        units: Math.floor(Math.random() * 500) + 50
      }));
      
      // Top outlets
      topOutlets = Array.from({ length: 5 }, (_, i) => ({
        id: `outlet${i + 1}`,
        name: `Outlet ${i + 1}`,
        sales: Math.floor(Math.random() * 2000000) + 500000,
        orders: Math.floor(Math.random() * 1000) + 100,
        products: Math.floor(Math.random() * 200) + 20
      }));
      
      // User growth data
      if (period === 'daily') {
        // Last 7 days
        userGrowthData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            users: Math.floor(Math.random() * 100) + 10,
            outlets: Math.floor(Math.random() * 20) + 2
          };
        });
      } else if (period === 'weekly') {
        // Last 4 weeks
        userGrowthData = Array.from({ length: 4 }, (_, i) => {
          return {
            date: `Week ${i + 1}`,
            users: Math.floor(Math.random() * 500) + 50,
            outlets: Math.floor(Math.random() * 100) + 10
          };
        });
      } else if (period === 'monthly') {
        // Last 6 months
        userGrowthData = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short' }),
            users: Math.floor(Math.random() * 2000) + 200,
            outlets: Math.floor(Math.random() * 400) + 40
          };
        });
      } else { // yearly
        // Last 12 months
        userGrowthData = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short' }),
            users: Math.floor(Math.random() * 5000) + 500,
            outlets: Math.floor(Math.random() * 1000) + 100
          };
        });
      }
      
      // Summary data
      const summaryData = {
        totalSales: salesData.reduce((sum, item) => sum + item.sales, 0),
        totalOrders: salesData.reduce((sum, item) => sum + item.orders, 0),
        averageOrderValue: Math.floor(salesData.reduce((sum, item) => sum + item.sales, 0) / salesData.reduce((sum, item) => sum + item.orders, 0)),
        totalUsers: Math.floor(Math.random() * 50000) + 10000,
        totalOutlets: Math.floor(Math.random() * 5000) + 1000,
        totalProducts: Math.floor(Math.random() * 100000) + 20000
      };
      
      resolve({
        salesData,
        categoryData,
        topProducts,
        topOutlets,
        userGrowthData,
        summaryData
      });
    }, 1500);
  });
};

const Analytics = () => {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Colors for charts
  const COLORS = ['#FF6B3D', '#FFA53D', '#FFD03D', '#3D9BFF', '#3DFFB5', '#FF3D77'];
  
  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const analyticsData = await fetchAnalyticsData(period);
        setData(analyticsData);
        setError(null);
      } catch (err) {
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalyticsData();
  }, [period]);
  
  // Handle period change
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name === 'sales' ? formatPrice(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p style={{ color: payload[0].color }} className="text-sm">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  if (isLoading && !data) {
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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex items-center text-red-500">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <p>{error}</p>
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
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View sales, orders, and user statistics
          </p>
        </div>
        
        {/* Period selector */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mr-4">Time Period</label>
              <select
                id="period"
                name="period"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                value={period}
                onChange={handlePeriodChange}
              >
                <option value="daily">Last 7 Days</option>
                <option value="weekly">Last 4 Weeks</option>
                <option value="monthly">Last 6 Months</option>
                <option value="yearly">Last 12 Months</option>
              </select>
            </div>
          </div>
        </div>
        
        {isLoading && data && (
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="flex justify-center">
              <Loader size="sm" />
              <span className="ml-2 text-sm text-gray-500">Refreshing data...</span>
            </div>
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{formatPrice(data.summaryData.totalSales)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBag className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{data.summaryData.totalOrders.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg. Order Value</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{formatPrice(data.summaryData.averageOrderValue)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{data.summaryData.totalUsers.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Outlets</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{data.summaryData.totalOutlets.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{data.summaryData.totalProducts.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sales and Orders Chart */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Sales & Orders</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {period === 'daily' ? 'Last 7 days' : period === 'weekly' ? 'Last 4 weeks' : period === 'monthly' ? 'Last 6 months' : 'Last 12 months'}
            </p>
          </div>
          
          <div className="px-4 pb-5">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.salesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#FF6B3D" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3D9BFF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="sales" name="Sales (₦)" stroke="#FF6B3D" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#3D9BFF" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
          {/* Sales by Category */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Sales by Category</h3>
            </div>
            
            <div className="px-4 pb-5">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* User Growth */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User & Outlet Growth</h3>
            </div>
            
            <div className="px-4 pb-5">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.userGrowthData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="users" name="New Users" fill="#3D9BFF" />
                    <Bar dataKey="outlets" name="New Outlets" fill="#FF6B3D" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Products */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Top Selling Products</h3>
            </div>
            
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Sold
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.topProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(product.sales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.units.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Top Outlets */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Top Performing Outlets</h3>
            </div>
            
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outlet
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.topOutlets.map((outlet) => (
                      <tr key={outlet.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {outlet.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(outlet.sales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {outlet.orders.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {outlet.products.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
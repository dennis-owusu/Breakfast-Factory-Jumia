import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
import { Calendar, DollarSign, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice } from '../../utils/helpers';
import { toast } from 'react-hot-toast';

const OutletAnalytics = () => {
  const { currentUser } = useSelector((state) => state.user);
  const outlet = currentUser || {};

  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = ['#FF6B3D', '#FFA53D', '#FFD03D', '#3D9BFF', '#3DFFB5', '#FF3D77'];

  // Sample data for different periods
  const sampleData = {
    daily: {
      salesData: [
        { date: 'Jul 9', sales: 12000, orders: 15 },
        { date: 'Jul 10', sales: 15000, orders: 20 },
        { date: 'Jul 11', sales: 18000, orders: 25 },
        { date: 'Jul 12', sales: 14000, orders: 18 },
        { date: 'Jul 13', sales: 17000, orders: 22 },
        { date: 'Jul 14', sales: 20000, orders: 30 },
        { date: 'Jul 15', sales: 22000, orders: 35 },
      ],
      productData: [
        { name: 'Electronics', value: 25000 },
        { name: 'Clothing', value: 18000 },
        { name: 'Food', value: 15000 },
        { name: 'Home', value: 12000 },
        { name: 'Beauty', value: 8000 },
      ],
      topProducts: [
        { id: '1', name: 'Smartphone', category: 'Electronics', sales: 15000, units: 50 },
        { id: '2', name: 'T-Shirt', category: 'Clothing', sales: 10000, units: 200 },
        { id: '3', name: 'Coffee', category: 'Food', sales: 8000, units: 150 },
        { id: '4', name: 'Lamp', category: 'Home', sales: 6000, units: 30 },
        { id: '5', name: 'Lipstick', category: 'Beauty', sales: 4000, units: 80 },
      ],
      summaryData: {
        totalSales: 118000,
        totalOrders: 165,
        averageOrderValue: 118000 / 165,
        totalProducts: 5,
      },
    },
    weekly: {
      salesData: [
        { date: 'Week 1', sales: 35000, orders: 50 },
        { date: 'Week 2', sales: 42000, orders: 60 },
        { date: 'Week 3', sales: 38000, orders: 55 },
        { date: 'Week 4', sales: 45000, orders: 70 },
      ],
      categoryData: [
        { name: 'Electronics', value: 40000 },
        { name: 'Clothing', value: 30000 },
        { name: 'Food', value: 25000 },
        { name: 'Home', value: 20000 },
        { name: 'Beauty', value: 15000 },
      ],
      topProducts: [
        { id: '1', name: 'Laptop', category: 'Electronics', sales: 25000, units: 40 },
        { id: '2', name: 'Jeans', category: 'Clothing', sales: 18000, units: 120 },
        { id: '3', name: 'Snacks', category: 'Food', sales: 12000, units: 200 },
        { id: '4', name: 'Sofa', category: 'Home', sales: 10000, units: 15 },
        { id: '5', name: 'Perfume', category: 'Beauty', sales: 8000, units: 60 },
      ],
      summaryData: {
        totalSales: 160000,
        totalOrders: 235,
        averageOrderValue: 160000 / 235,
        totalProducts: 5,
      },
    },
    monthly: {
      salesData: [
        { date: 'Feb', sales: 80000, orders: 100 },
        { date: 'Mar', sales: 95000, orders: 120 },
        { date: 'Apr', sales: 85000, orders: 110 },
        { date: 'May', sales: 100000, orders: 130 },
        { date: 'Jun', sales: 110000, orders: 150 },
        { date: 'Jul', sales: 120000, orders: 160 },
      ],
      categoryData: [
        { name: 'Electronics', value: 150000 },
        { name: 'Clothing', value: 100000 },
        { name: 'Food', value: 80000 },
        { name: 'Home', value: 60000 },
        { name: 'Beauty', value: 40000 },
      ],
      topProducts: [
        { id: '1', name: 'Tablet', category: 'Electronics', sales: 80000, units: 100 },
        { id: '2', name: 'Dress', category: 'Clothing', sales: 50000, units: 250 },
        { id: '3', name: 'Beverages', category: 'Food', sales: 40000, units: 300 },
        { id: '4', name: 'Chair', category: 'Home', sales: 30000, units: 50 },
        { id: '5', name: 'Skincare', category: 'Beauty', sales: 20000, units: 150 },
      ],
      summaryData: {
        totalSales: 590000,
        totalOrders: 770,
        averageOrderValue: 590000 / 770,
        totalProducts: 5,
      },
    },
    yearly: {
      salesData: [
        { date: 'Aug 2024', sales: 120000, orders: 150 },
        { date: 'Sep 2024', sales: 130000, orders: 160 },
        { date: 'Oct 2024', sales: 140000, orders: 170 },
        { date: 'Nov 2024', sales: 150000, orders: 180 },
        { date: 'Dec 2024', sales: 160000, orders: 190 },
        { date: 'Jan 2025', sales: 170000, orders: 200 },
        { date: 'Feb 2025', sales: 180000, orders: 210 },
        { date: 'Mar 2025', sales: 190000, orders: 220 },
        { date: 'Apr 2025', sales: 200000, orders: 230 },
        { date: 'May 2025', sales: 210000, orders: 240 },
        { date: 'Jun 2025', sales: 220000, orders: 250 },
        { date: 'Jul 2025', sales: 230000, orders: 260 },
      ],
      categoryData: [
        { name: 'Electronics', value: 300000 },
        { name: 'Clothing', value: 200000 },
        { name: 'Food', value: 150000 },
        { name: 'Home', value: 100000 },
        { name: 'Beauty', value: 80000 },
      ],
      topProducts: [
        { id: '1', name: 'Smart TV', category: 'Electronics', sales: 150000, units: 200 },
        { id: '2', name: 'Jacket', category: 'Clothing', sales: 100000, units: 500 },
        { id: '3', name: 'Groceries', category: 'Food', sales: 80000, units: 600 },
        { id: '4', name: 'Table', category: 'Home', sales: 60000, units: 100 },
        { id: '5', name: 'Makeup Kit', category: 'Beauty', sales: 40000, units: 300 },
      ],
      summaryData: {
        totalSales: 2090000,
        totalOrders: 2550,
        averageOrderValue: 2090000 / 2550,
        totalProducts: 5,
      },
    },
  };

  // Load sample data based on period
  /* useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Set sample data based on selected period
        const selectedData = sampleData[period];
        if (!selectedData) {
          throw new Error('Invalid period selected');
        }
        setData(selectedData);
      } catch (err) {
        console.error('Failed to load analytics data:', err.message);
        setError('Failed to load analytics data. Please try again later.');
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    if (outlet._id) {
      loadAnalyticsData();
    } else {
      setError('No outlet found. Please ensure you are logged in.');
      setIsLoading(false);
    }
  }, [period, outlet._id]); */


  //Main analytics data from the server
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const headers = {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
        };
        const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/analytics?period=${period}&outletId=${outlet._id}`, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON');
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch analytics data');
        }
        setData(result.data);
      } catch (err) {
        console.error('Failed to load analytics data:', err.message);
        setError('Failed to load analytics data. Please try again later.');
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    if (outlet._id) {
      loadAnalyticsData();
    } else {
      setError('No outlet found. Please ensure you are logged in.');
      setIsLoading(false);
    }
  }, [period, outlet._id, currentUser?.token]);

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

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  // Render error or no data state
  if (error || !data) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex items-center text-red-500">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <p>{error || 'No data available. Please try again later.'}</p>
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
            {outlet.name || 'Outlet'} Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View sales, orders, and product statistics for your outlet
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
                aria-label="Select time period"
              >
                <option value="daily">Last 7 Days</option>
                <option value="weekly">Last 4 Weeks</option>
                <option value="monthly">Last 6 Months</option>
                <option value="yearly">Last 12 Months</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
                  <Line yAxisId="left" type="monotone" dataKey="sales" name="Sales (₵)" stroke="#FF6B3D" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#3D9BFF" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
          {/* Sales by Product */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Sales by Product</h3>
            </div>

            <div className="px-4 pb-5">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.productData.map((entry, index) => (
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

          {/* Monthly Sales Trend */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Sales Trend</h3>
            </div>

            <div className="px-4 pb-5">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.salesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="sales" name="Sales (₵)" fill="#FF6B3D" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
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
                        {product.name || product.category || 'Uncategorized'}
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
      </div>
    </div>
  );
};

export default OutletAnalytics;
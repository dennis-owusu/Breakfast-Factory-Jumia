import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Eye,
  Package
} from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';

// This would be imported from an API utility file in a real app
const fetchOrders = async (params) => {
  // Simulate API call with filtering and pagination
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate 50 orders
      const allOrders = Array.from({ length: 50 }, (_, i) => {
        const orderDate = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
        const orderStatus = [
          'pending', 'processing', 'shipped', 'delivered', 'cancelled'
        ][Math.floor(Math.random() * 5)];
        
        const paymentStatus = orderStatus === 'cancelled' ? 'refunded' : 
          (orderStatus === 'delivered' ? 'paid' : 
            (Math.random() > 0.3 ? 'paid' : 'pending'));
        
        const paymentMethod = ['cash_on_delivery', 'card', 'bank_transfer'][Math.floor(Math.random() * 3)];
        
        const itemsCount = Math.floor(Math.random() * 5) + 1;
        const totalAmount = Math.floor(Math.random() * 100000) + 5000;
        
        return {
          _id: `order${i + 1}`,
          orderNumber: `ORD-${100000 + i}`,
          customer: {
            _id: `user${i + 100}`,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            phone: `+234${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`
          },
          items: Array.from({ length: itemsCount }, (_, j) => ({
            _id: `item${i}${j}`,
            product: {
              _id: `product${i * 10 + j}`,
              name: `Product ${i * 10 + j}`,
              image: `https://picsum.photos/id/${(i * 10 + j) % 1000}/400/400`
            },
            price: Math.floor(Math.random() * 10000) + 1000,
            quantity: Math.floor(Math.random() * 3) + 1,
            outlet: {
              _id: `outlet${Math.floor(i / 5) + 1}`,
              name: `Outlet ${Math.floor(i / 5) + 1}`
            }
          })),
          shippingAddress: {
            street: `${i + 100} Main Street`,
            city: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'][Math.floor(Math.random() * 5)],
            state: ['Lagos', 'FCT', 'Rivers', 'Oyo', 'Kano'][Math.floor(Math.random() * 5)],
            country: 'Nigeria',
            zipCode: `${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
          },
          paymentMethod,
          paymentStatus,
          totalAmount,
          status: orderStatus,
          createdAt: orderDate.toISOString(),
          updatedAt: new Date(orderDate.getTime() + (Math.random() * 24 * 60 * 60 * 1000)).toISOString()
        };
      });
      
      // Apply search filter
      let filteredOrders = [...allOrders];
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.orderNumber.toLowerCase().includes(searchLower) || 
          order.customer.name.toLowerCase().includes(searchLower) ||
          order.customer.email.toLowerCase().includes(searchLower) ||
          order.customer.phone.includes(params.search) ||
          order.items.some(item => item.product.name.toLowerCase().includes(searchLower)) ||
          order.shippingAddress.city.toLowerCase().includes(searchLower) ||
          order.shippingAddress.state.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply status filter
      if (params.status && params.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === params.status);
      }
      
      // Apply payment status filter
      if (params.paymentStatus && params.paymentStatus !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.paymentStatus === params.paymentStatus);
      }
      
      // Apply payment method filter
      if (params.paymentMethod && params.paymentMethod !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.paymentMethod === params.paymentMethod);
      }
      
      // Apply date range filter
      if (params.startDate) {
        const startDate = new Date(params.startDate);
        filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) >= startDate);
      }
      
      if (params.endDate) {
        const endDate = new Date(params.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the day
        filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) <= endDate);
      }
      
      // Calculate pagination
      const totalOrders = filteredOrders.length;
      const totalPages = Math.ceil(totalOrders / params.limit);
      const offset = (params.page - 1) * params.limit;
      const paginatedOrders = filteredOrders.slice(offset, offset + params.limit);
      
      resolve({
        orders: paginatedOrders,
        pagination: {
          total: totalOrders,
          totalPages,
          currentPage: params.page,
          limit: params.limit
        }
      });
    }, 1000);
  });
};

const OrdersManagement = () => {
  // State for filters and pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // State for data
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  });
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load orders based on filters and pagination
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOrders({
          search,
          status,
          paymentStatus,
          paymentMethod,
          startDate,
          endDate,
          page,
          limit
        });
        
        setOrders(data.orders);
        setPagination(data.pagination);
        setError(null);
      } catch (err) {
        setError('Failed to load orders. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, [search, status, paymentStatus, paymentMethod, startDate, endDate, page, limit]);
  
  // Handle search input
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };
  
  // Handle filter changes
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  const handlePaymentStatusChange = (e) => {
    setPaymentStatus(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  // Handle pagination
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };
  
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
  
  // Helper function to get payment status badge color
  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to format payment method
  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      case 'card':
        return 'Card Payment';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method;
    }
  };
  
  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Orders Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all orders on the platform
          </p>
        </div>
        
        {error && (
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
        )}
        
        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* Search */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 sr-only">Search</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search by order #, customer, or product"
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Order Status</label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  value={status}
                  onChange={handleStatusChange}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Payment Status Filter */}
              <div>
                <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  value={paymentStatus}
                  onChange={handlePaymentStatusChange}
                >
                  <option value="all">All Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              
              {/* Payment Method Filter */}
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  value={paymentMethod}
                  onChange={handlePaymentMethodChange}
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash_on_delivery">Cash on Delivery</option>
                  <option value="card">Card Payment</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              
              {/* Date Range Filter */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={startDate}
                    onChange={handleStartDateChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={endDate}
                    onChange={handleEndDateChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Orders Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading && orders.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-center">
                <Loader size="sm" />
                <span className="ml-2 text-sm text-gray-500">Refreshing data...</span>
              </div>
            </div>
          )}
          
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
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No orders found matching your criteria
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-orange-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-xs text-gray-500">{order.items.length} item(s)</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.email}</div>
                        <div className="text-xs text-gray-500">{order.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(order.paymentStatus)}`}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {formatPaymentMethod(order.paymentMethod)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/admin/orders/${order._id}`} 
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border ${pageNum === page ? 'z-10 bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'} text-sm font-medium`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      onClick={handleNextPage}
                      disabled={page === pagination.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;
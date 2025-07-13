import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { outletAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Function to fetch outlet orders from API
const fetchOutletOrders = async (page = 1, limit = 10, search = '', filters = {}) => {
  try {
    // Prepare query parameters
    const params = {
      page,
      limit,
      search: search || undefined
    };
    
    // Add status filter if provided and not 'all'
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    
    // Add date range filter if provided
    if (filters.dateRange) {
      params.dateRange = filters.dateRange;
    }
    
    // Make API call
    const response = await outletAPI.getOutletOrders(params);
    return {
      orders: response.data.orders,
      pagination: {
        page: response.data.page,
        limit: response.data.limit,
        totalOrders: response.data.totalOrders,
        totalPages: response.data.totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching outlet orders:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch orders');
  }
};

const OutletOrders = () => {
  const { user } = useSelector((state) => state.auth);
  const outlet = user?.outlet || {};
  
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await fetchOutletOrders(
          pagination.page,
          pagination.limit,
          search,
          filters
        );
        
        setOrders(result.orders);
        setPagination(prev => ({
          ...prev,
          totalOrders: result.pagination.totalOrders,
          totalPages: result.pagination.totalPages,
        }));
      } catch (err) {
        const errorMessage = err.message || 'Failed to load orders. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, [pagination.page, pagination.limit, search, filters]);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
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
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your outlet's orders
            </p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
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
        )}
        
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search */}
              <div className="w-full md:w-1/2">
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="Search by order number or customer..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button type="submit" className="hidden">Search</button>
                </form>
              </div>
              
              {/* Filter Toggle */}
              <div className="flex items-center">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="-ml-0.5 mr-2 h-4 w-4" />
                  Filters
                </button>
                
                {/* Clear Filters */}
                {(filters.status !== 'all' || filters.dateRange || search) && (
                  <button
                    type="button"
                    className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    onClick={() => {
                      setFilters({ status: 'all', dateRange: '' });
                      setSearch('');
                      setSearchInput('');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Order Status</label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">Date Range</label>
                  <select
                    id="dateRange"
                    name="dateRange"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                    value={filters.dateRange}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Orders Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading && orders.length > 0 ? (
            <div className="p-6 flex justify-center">
              <Loader size="md" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || filters.status !== 'all' || filters.dateRange
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You have no orders yet.'}
              </p>
            </div>
          ) : (
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
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={order.items[0]?.product.images[0] || 'https://via.placeholder.com/150'}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.paymentMethod}</div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(order.paymentStatus)}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/outlet/orders/${order._id}`}
                          className="text-orange-500 hover:text-orange-600"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.totalOrders)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalOrders}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.page === page ? 'z-10 bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
              
              {/* Mobile pagination */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === 1 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === pagination.totalPages ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutletOrders;
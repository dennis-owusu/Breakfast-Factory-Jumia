import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Package } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

// This would be imported from an API utility file in a real app
const fetchUserOrders = async (page = 1, limit = 10, search = '', filters = {}) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate mock orders
      const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      const mockOrders = Array.from({ length: 25 }, (_, i) => {
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const totalAmount = Math.floor(Math.random() * 100000) + 5000;
        
        return {
          _id: `ord${i + 100}`,
          orderNumber: `ORD-${100000 + i}`,
          createdAt: orderDate.toISOString(),
          totalAmount,
          status,
          items: [
            {
              product: {
                _id: `prod${i + 100}`,
                name: [
                  'Wireless Headphones',
                  'Smartphone Case',
                  'Smart Watch',
                  'Bluetooth Speaker',
                  'Power Bank'
                ][Math.floor(Math.random() * 5)],
                images: ['https://via.placeholder.com/150']
              },
              quantity: Math.floor(Math.random() * 3) + 1
            }
          ]
        };
      });

      // Apply search filter if provided
      let filteredOrders = mockOrders;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredOrders = mockOrders.filter(order => 
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.items.some(item => item.product.name.toLowerCase().includes(searchLower))
        );
      }

      // Apply status filter if provided
      if (filters.status && filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }

      // Apply date filter if provided
      if (filters.dateFrom || filters.dateTo) {
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          let isValid = true;
          
          if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            isValid = isValid && orderDate >= fromDate;
          }
          
          if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of the day
            isValid = isValid && orderDate <= toDate;
          }
          
          return isValid;
        });
      }

      // Calculate pagination
      const totalOrders = filteredOrders.length;
      const totalPages = Math.ceil(totalOrders / limit);
      const startIndex = (page - 1) * limit;
      const paginatedOrders = filteredOrders.slice(startIndex, startIndex + limit);

      resolve({
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          totalOrders,
          totalPages
        }
      });
    }, 1000);
  });
};

const UserOrders = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 0
  });
  
  // Search and filter state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    if (currentUser && currentUser.token) {
      const socket = io('http://localhost:5000', {
        auth: { token: currentUser.token }
      });

      socket.on('orderStatusUpdated', (data) => {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === data.orderId ? { ...order, status: data.newStatus } : order
          )
        );
        toast.success(data.message);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [currentUser]);
  
  // Fetch orders on component mount and when filters change
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetchUserOrders(
          pagination.page,
          pagination.limit,
          search,
          filters
        );
        setOrders(response.orders);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [pagination.page, pagination.limit, search, filters]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">View and track your order history</p>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders by number or product..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-orange-500 focus:border-orange-500"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="status"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
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
            
            <div className="flex items-center gap-2">
              <input
                type="date"
                name="dateFrom"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                placeholder="From"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                name="dateTo"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                value={filters.dateTo}
                onChange={handleFilterChange}
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-gray-500 mt-2">
              {search || filters.status !== 'all' || filters.dateFrom || filters.dateTo
                ? 'Try adjusting your search or filters'
                : 'You haven\'t placed any orders yet'}
            </p>
            {(search || filters.status !== 'all' || filters.dateFrom || filters.dateTo) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilters({ status: 'all', dateFrom: '', dateTo: '' });
                }}
                className="mt-4 px-4 py-2 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/products"
              className="mt-4 inline-block px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPrice(order.totalAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={order.items[0].product.images[0]} 
                              alt={order.items[0].product.name} 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.items[0].product.name}
                            </div>
                            {order.items.length > 1 && (
                              <div className="text-sm text-gray-500">
                                +{order.items.length - 1} more item(s)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/user/orders/${order._id}`} 
                          className="text-orange-600 hover:text-orange-900 flex items-center justify-end gap-1"
                        >
                          <span>View</span>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.totalOrders)}
                      </span> of <span className="font-medium">{pagination.totalOrders}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {[...Array(pagination.totalPages).keys()].map(number => {
                        const pageNumber = number + 1;
                        // Show current page, first, last, and pages around current
                        const showPageNumber = pageNumber === 1 || 
                                              pageNumber === pagination.totalPages || 
                                              Math.abs(pageNumber - pagination.page) <= 1;
                        
                        if (!showPageNumber) {
                          // Show ellipsis for skipped pages
                          if (pageNumber === 2 || pageNumber === pagination.totalPages - 1) {
                            return (
                              <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border ${pageNumber === pagination.page ? 'bg-orange-50 border-orange-500 text-orange-600 z-10' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'} text-sm font-medium`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${pagination.page === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserOrders;
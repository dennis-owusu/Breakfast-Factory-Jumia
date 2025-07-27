import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { saveAs } from 'file-saver';

const OutletOrders = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', dateRange: 'all' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalOrders: 0, totalPages: 1 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [timeRange, setTimeRange] = useState('daily');

  // Renamed to avoid conflict
  const handleTimeRangeChange = (newFilter) => {
    setTimeRange(newFilter);
  };

  const handleDownload = () => {
    const headers = ['Order Number', 'Customer', 'Total Amount', 'Status', 'Date'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const order of orders) {
      const values = [
        order.orderNumber,
        `"${order.userInfo.name}"`,
        formatPrice(order.totalPrice),
        order.status,
        formatDate(order.createdAt)
      ];
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `orders-${timeRange}.csv`);
  };

  useEffect(() => {
    if (currentUser && currentUser.token) {
      console.log('Setting up Socket.IO connection for outlet:', currentUser._id);
      const socket = io('http://localhost:3000', {
        auth: { token: currentUser.token }
      });

      socket.on('connect', () => {
        console.log('Socket connected for outlet orders. Socket ID:', socket.id);
        console.log('Outlet should be in room:', currentUser._id);
      });

      socket.on('orderStatusUpdated', (data) => {
        console.log('Received order status update for outlet:', data);
        console.log('Current orders before update:', orders);
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(order =>
            order._id === data.orderId ? { ...order, status: data.newStatus } : order
          );
          console.log('Orders after update:', updatedOrders);
          return updatedOrders;
        });
        toast.success(data.message);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected from outlet orders. Reason:', reason);
      });

      return () => {
        console.log('Cleaning up socket connection for outlet orders');
        socket.disconnect();
      };
    }
  }, [currentUser]);

  // Utility functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPrice = (amount) => {
    return `₦${amount.toFixed(2)}`;
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
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

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          startIndex: (pagination.page - 1) * pagination.limit,
          limit: pagination.limit,
          ...(searchInput && { searchTerm: searchInput }),
          ...(filters.status !== 'all' && { status: filters.status }),
          ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
          timeRange: timeRange,
        });

        const headers = {
          'Content-Type': 'application/json',
        };

        const response = await fetch(`/api/route/getOutletOrders/${currentUser._id}?${queryParams.toString()}`, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON, received HTML or other content');
        }

        const data = await response.json();
        console.log('Fetched orders:', data);
        if (!data) {
          setOrders([]);
          setError('No orders found');
          return;
        }

        const sortOrders = (ordersArray) => {
          return [...ordersArray].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        };

        if (data.orders) {
          setOrders(sortOrders(data.orders));
          setPagination({
            ...pagination,
            totalOrders: data.totalOrders || 0,
            totalPages: Math.ceil(data.totalOrders / pagination.limit) || 1,
          });
        } else {
          const ordersArray = Array.isArray(data) ? data : [];
          setOrders(sortOrders(ordersArray));
          setPagination({
            ...pagination,
            totalOrders: ordersArray.length,
            totalPages: Math.ceil(ordersArray.length / pagination.limit) || 1,
          });
        }
        setError(null);
      } catch (err) {
        console.error('Fetch orders error:', err.message);
        setError(err.message);
        toast.error(err.message);
        setOrders([]);
        setPagination({ ...pagination, totalOrders: 0, totalPages: 1 });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchOrders();
    } else {
      setError('Please log in to view orders');
      setIsLoading(false);
    }
  }, [pagination.page, searchInput, filters, currentUser?.token, timeRange]);

  // Polling for updates every 30 seconds
  useEffect(() => {
    const pollOrders = async () => {
      try {
        const queryParams = new URLSearchParams({
          startIndex: (pagination.page - 1) * pagination.limit,
          limit: pagination.limit,
          ...(searchInput && { searchTerm: searchInput }),
          ...(filters.status !== 'all' && { status: filters.status }),
          ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
        });

        const headers = {
          'Content-Type': 'application/json',
        };

        const response = await fetch(`/api/route/getOutletOrders/${currentUser._id}?${queryParams.toString()}`, { headers });
        if (!response.ok) return;

        const data = await response.json();
        if (data.orders) {
          setOrders(data.orders);
          setPagination({
            ...pagination,
            totalOrders: data.totalOrders || 0,
            totalPages: Math.ceil(data.totalOrders / pagination.limit) || 1,
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const intervalId = setInterval(pollOrders, 30000);

    return () => clearInterval(intervalId);
  }, [pagination.page, searchInput, filters, currentUser?.token]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination({ ...pagination, page: 1 });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination({ ...pagination, page });
    }
  };

  // Handle delete click
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(currentUser && { Authorization: `Bearer ${currentUser}` }),
      };

      const response = await fetch(`/api/route/deleteOrder/${orderToDelete._id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response: Expected JSON, received HTML or other content');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete order');
      }

      setOrders(orders.filter((o) => o._id !== orderToDelete._id));
      toast.success('Order deleted successfully');
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Delete order error:', err.message);
      toast.error(err.message);
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
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
                  <Input
                    type="text"
                    placeholder="Search by order number or customer..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                  <button type="submit" className="hidden">Search</button>
                </form>
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="-ml-0.5 mr-2 h-4 w-4" />
                  Filters
                </Button>

                {/* Clear Filters */}
                {(filters.status !== 'all' || filters.dateRange !== 'all' || searchInput) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({ status: 'all', dateRange: 'all' });
                      setSearchInput('');
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Order Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange({ target: { name: 'status', value } })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
                    Date Range
                  </label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => handleFilterChange({ target: { name: 'dateRange', value } })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last7days">Last 7 Days</SelectItem>
                      <SelectItem value="last30days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
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
                {searchInput || filters.status !== 'all' || filters.dateRange
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You have no orders yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...orders]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={
                                  order.products?.[0]?.product?.images?.[0] ||
                                  'https://via.placeholder.com/150'
                                }
                                alt={order.products?.[0]?.product?.name || 'Order'}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {order.orderNumber || order._id || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.products?.length || 0}{' '}
                                {order.products?.length === 1 ? 'item' : 'items'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.user?.name || order.userInfo?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user?.email || order.userInfo?.email || 'No email'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user?.phoneNumber ||
                              order.userInfo?.phoneNumber ||
                              order.phoneNumber ||
                              'No phone'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select
                            value={order.status || 'pending'}
                            onValueChange={async (value) => {
                              try {
                                const headers = {
                                  'Content-Type': 'application/json',
                                  ...(currentUser?.token && {
                                    Authorization: `Bearer ${currentUser.token}`,
                                  }),
                                };
                                const response = await fetch(
                                  `http://localhost:3000/api/route/updateOrder/${order._id}`,
                                  {
                                    method: 'PUT',
                                    headers,
                                    body: JSON.stringify({ status: value }),
                                  }
                                );
                                if (!response.ok) {
                                  throw new Error(`HTTP error ${response.status}`);
                                }
                                const result = await response.json();
                                if (result.success) {
                                  setOrders((prevOrders) =>
                                    prevOrders.map((o) =>
                                      o._id === order._id ? { ...o, status: value } : o
                                    )
                                  );
                                  toast.success('Order status updated');
                                }
                              } catch (err) {
                                console.error('Update order error:', err.message);
                                toast.error('Failed to update order status');
                              }
                            }}
                          >
                            <SelectTrigger
                              className={`text-xs font-semibold rounded-full border-none focus:ring-2 focus:ring-orange-500 ${getStatusBadgeColor(
                                order.status
                              )}`}
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.totalPrice ? formatPrice(order.totalPrice) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/outlet/orders/${order._id}`}
                              className="text-orange-500 hover:text-orange-600"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(order)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button> */}
                          </div>
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
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.totalOrders)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalOrders}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </Button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant="outline"
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === page
                              ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === pagination.totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </nav>
                </div>
              </div>

              {/* Mobile pagination */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === 1
                      ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Previous
                </Button>
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === pagination.totalPages
                      ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete order{' '}
                <span className="font-medium">{orderToDelete?._id || 'N/A'}</span>? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutletOrders;
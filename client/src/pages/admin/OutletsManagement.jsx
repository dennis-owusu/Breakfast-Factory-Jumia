import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Store
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';

const fetchOutlets = async (params) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    const url = `/api/auth/get-all-users${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const filteredOutlets = (data.allUsers || []).filter(user => user.usersRole === 'outlet').map(user => ({
      ...user,
      name: user.storeName || user.name || 'Unnamed Outlet',
      owner: {
        name: user.name || 'Unknown',
        email: user.email || 'No email'
      },
      description: user.description || '',
      categories: user.categories || [],
      status: user.status || 'pending',
      productsCount: user.productsCount || 0,
      ordersCount: user.ordersCount || 0,
      totalSales: user.totalSales || 0,
      rating: user.rating || 0
    }));
    return {
      outlets: filteredOutlets,
      pagination: {
        total: data.pagination?.total || filteredOutlets.length,
        totalPages: data.pagination?.totalPages || 1,
        currentPage: data.pagination?.page || 1,
        limit: 10
      }
    };
  } catch (error) {
    console.error('Error fetching outlets:', error);
    throw error;
  }
};

const updateOutletStatus = async (outletId, status) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    const response = await fetch(`/api/auth/user/update/${outletId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating outlet status:', error);
    throw error;
  }
};

const OutletsManagement = () => {
  // State for filters and pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // State for data
  const [outlets, setOutlets] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  });
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Categories for filter
  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Books', 'Sports'];
  
  // Load outlets based on filters and pagination
  useEffect(() => {
    const loadOutlets = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOutlets({
          search,
          status,
          category,
          page,
          limit
        });
        
        setOutlets(data.outlets);
        setPagination(data.pagination);
        setError(null);
      } catch (err) {
        setError('Failed to load outlets. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOutlets();
  }, [search, status, category, page, limit]);
  
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
  
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
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
  
  // Handle outlet status update
  const handleStatusUpdate = async (outletId, newStatus) => {
    const statusAction = newStatus === 'active' ? 'approve' : (newStatus === 'rejected' ? 'reject' : 'update status of');
    
    if (!window.confirm(`Are you sure you want to ${statusAction} this outlet?`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      const result = await updateOutletStatus(outletId, newStatus);
      
      if (result.success) {
        // Update local state
        setOutlets(prevOutlets => 
          prevOutlets.map(outlet => 
            outlet._id === outletId ? { ...outlet, status: newStatus } : outlet
          )
        );
        
        setSuccessMessage(result.message);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to update outlet status. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to format sales amount
  const formatSales = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  if (isLoading && outlets.length === 0) {
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
            Outlets Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all seller outlets on the platform
          </p>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                    placeholder="Search by outlet name, description, or owner"
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  value={status}
                  onChange={handleStatusChange}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  id="category"
                  name="category"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  value={category}
                  onChange={handleCategoryChange}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Outlets Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading && outlets.length > 0 && (
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
                    Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outlets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No outlets found matching your criteria
                    </td>
                  </tr>
                ) : (
                  outlets.map((outlet) => (
                    <tr key={outlet._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <Store className="h-5 w-5 text-orange-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{outlet.name}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">{outlet.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {outlet.categories.map((cat, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{outlet.owner.name}</div>
                        <div className="text-sm text-gray-500">{outlet.owner.email}</div>
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
                        {outlet.ordersCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatSales(outlet.totalSales)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-sm text-gray-600">{outlet.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/admin/outlets/${outlet._id}`} 
                            className="text-orange-600 hover:text-orange-900"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          
                          {outlet.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(outlet._id, 'active')}
                                disabled={actionLoading}
                                className={`text-green-600 hover:text-green-900 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Approve Outlet"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(outlet._id, 'rejected')}
                                disabled={actionLoading}
                                className={`text-red-600 hover:text-red-900 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Reject Outlet"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          
                          {outlet.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(outlet._id, 'inactive')}
                              disabled={actionLoading}
                              className={`text-red-600 hover:text-red-900 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Deactivate Outlet"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                          
                          {outlet.status === 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(outlet._id, 'active')}
                              disabled={actionLoading}
                              className={`text-green-600 hover:text-green-900 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Approve Outlet"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
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

export default OutletsManagement;
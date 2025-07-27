import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createRestockRequest, fetchOutletRestockRequests, clearSuccess, clearError } from '../../redux/slices/restockSlice';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Filter, Search, X } from 'lucide-react';

const OutletRestock = () => {
  const dispatch = useDispatch();
  const { requests, loading, error, success, totalRequests } = useSelector((state) => state.restock);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize pagination state with default values
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRequests: 0,
    totalPages: 1,
  });

  // Initialize other missing states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    productId: searchParams.get('productId') || '',
    requestedQuantity: '',
    currentQuantity: searchParams.get('quantity') || '',
  });

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({ status: 'all', dateRange: 'all' });
    setPagination({ ...pagination, page: 1 });
  };

  // Handle page change
  const handlePageChange = (direction) => {
    const newPage = pagination.page + direction;
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  // Fetch restock requests
  useEffect(() => {
    const queryParams = new URLSearchParams();
    queryParams.append('startIndex', (pagination.page - 1) * pagination.limit);
    queryParams.append('limit', pagination.limit);
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    if (filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.dateRange !== 'all') queryParams.append('dateRange', filters.dateRange);

    dispatch(fetchOutletRestockRequests(queryParams.toString()));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, filters]);

  // Update pagination when totalRequests changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalRequests: totalRequests || 0,
      totalPages: Math.ceil((totalRequests || 0) / prev.limit) || 1,
    }));
  }, [totalRequests]);

  // Handle success and clear form
  useEffect(() => {
    if (success) {
      setFormData({ productId: '', requestedQuantity: '', reason: '' });
      setTimeout(() => dispatch(clearSuccess()), 3000);
    }
  }, [success, dispatch]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createRestockRequest(formData));
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Restock Management</h1>

      {/* Restock Request Form */}
      <Card className="mb-8">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Create Restock Request</h2>
          
          <div className="space-y-2">
            <label className="block font-medium">Current Stock</label>
            <Input
              value={formData.currentQuantity}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="requestedQuantity" className="block font-medium">Add Quantity</label>
            <Input
              id="requestedQuantity"
              name="requestedQuantity"
              type="number"
              min="1"
              value={formData.requestedQuantity}
              onChange={handleChange}
              required
              placeholder="Enter quantity to add"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/outlet/products')}>
              Cancel
            </Button>
          </div>

          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}

          {success && (
            <p className="text-green-500 mt-2">Restock request created successfully!</p>
          )}
        </form>
      </Card>

      {/* Restock Requests List */}
      <Card className="mt-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Restock Requests</h2>
            <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="mb-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="flex-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearAllFilters} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}

          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p>No restock requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Outlet</th>
                    <th className="text-left py-3 px-4">Requested Qty</th>
                    <th className="text-left py-3 px-4">Current Qty</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Admin Note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{request.product?.productName || 'N/A'}</td>
                      <td className="py-3 px-4">{request.outlet?.storeName || request.outlet?.name || request.outlet?.email || 'Unknown Outlet'}</td>
                      <td className="py-3 px-4">{request.requestedQuantity}</td>
                      <td className="py-3 px-4">{request.currentQuantity}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{request.adminNote || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button onClick={() => handlePageChange(-1)} disabled={pagination.page === 1}>Previous</Button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <Button onClick={() => handlePageChange(1)} disabled={pagination.page === pagination.totalPages}>Next</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OutletRestock;
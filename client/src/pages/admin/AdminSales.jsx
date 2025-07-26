import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  Download,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatPrice, formatDate } from '../../utils/helpers';

const AdminSales = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ 
    period: 'all', 
    minAmount: '', 
    maxAmount: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalSales: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalSales: 0, averageSale: 0, saleCount: 0 });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoading(true);
        
        // Build query parameters
        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit
        });
        
        if (searchInput) queryParams.append('search', searchInput);
        if (filters.period !== 'all') queryParams.append('period', filters.period);
        if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
        if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        
        // Set headers with authentication token
        const headers = {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
        };
        
        // Make API call to fetch sales data
        const response = await fetch(`/api/route/sales?${queryParams.toString()}`, { headers });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data) {
          throw new Error(data.message || 'Failed to fetch sales data');
        }
        
        const sortedSales = [...data.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
        setSales(sortedSales);
        setSummary(data.summary);
        setPagination(prev => ({
          ...prev,
          totalSales: data.totalSales,
          totalPages: data.totalPages
        }));
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchSales();
    } else {
      setError('No user found. Please ensure you are logged in.');
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchInput, filters, currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination({ ...pagination, page });
    }
  };

  const handleDownloadReport = async (format = 'excel') => {
    try {
      setIsDownloading(true);
      
      // Build query parameters for the report
      const queryParams = new URLSearchParams({
        format: format
      });
      
      // Add filters to query params
      if (filters.period !== 'all') queryParams.append('period', filters.period);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      // Set headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        'Accept': format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
        ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
      };
      
      // Make API call to download report
      const response = await fetch(`/api/route/admin/sales-report?${queryParams.toString()}`, { 
        headers,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      // Get the blob from the response with the correct MIME type
      const blob = await response.blob();
      const contentType = format === 'excel' ? 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
        'text/csv';
      
      // Create a new blob with the correct content type
      const fileBlob = new Blob([blob], { type: contentType });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(fileBlob);
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Set the file name
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `sales_report_${dateStr}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      
      // Append to the document and trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Sales report downloaded successfully`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error(`Failed to download report: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading && sales.length === 0) return <Loader />;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Management</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={() => handleDownloadReport('excel')} 
            disabled={isDownloading}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Export to Excel'}
          </Button>
          <Button 
            onClick={() => handleDownloadReport('csv')} 
            disabled={isDownloading}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(summary.totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Average Sale</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(summary.averageSale)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Sale Count</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.saleCount}</p>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search sales..."
            className="flex-1 p-2 border rounded"
          />
          <Button type="submit"><Search size={20} /></Button>
          <Button type="button" onClick={() => setShowFilters(!showFilters)}><Filter size={20} /></Button>
        </div>
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select name="period" value={filters.period} onChange={handleFilterChange} className="p-2 border rounded">
              <option value="all">All Periods</option>
              <option value="daily">Today</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
              <option value="yearly">Last Year</option>
            </select>
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Min Amount</label>
              <input 
                name="minAmount" 
                value={filters.minAmount} 
                onChange={handleFilterChange} 
                placeholder="Min Amount" 
                className="p-2 border rounded" 
                type="number"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Max Amount</label>
              <input 
                name="maxAmount" 
                value={filters.maxAmount} 
                onChange={handleFilterChange} 
                placeholder="Max Amount" 
                className="p-2 border rounded" 
                type="number"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Start Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="pl-10 p-2 border rounded w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">End Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="pl-10 p-2 border rounded w-full"
                />
              </div>
            </div>
          </div>
        )}
      </form>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No sales found matching your criteria
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(sale.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{sale._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(sale.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.items}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${
                        sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{sale.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="sm:hidden p-4">
          <div className="grid grid-cols-1 gap-4">
            {sales.length === 0 ? (
              <div className="text-center text-sm text-gray-500 p-4">
                No sales found matching your criteria
              </div>
            ) : (
              sales.map((sale) => (
                <div key={sale._id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Date</span>
                      <span className="text-xs font-semibold">{formatDate(sale.date)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Order ID</span>
                      <span className="text-xs font-semibold text-orange-600">{sale._id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Customer</span>
                      <span className="text-xs font-semibold">{sale.customer?.name || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Amount</span>
                      <span className="text-xs font-semibold">{formatPrice(sale.amount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Items</span>
                      <span className="text-xs font-semibold">{sale.items}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Status</span>
                      <Badge className={`text-xs ${
                        sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{sale.status}</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {pagination.totalPages > 1 && (
        <div className="flex justify-between mt-4">
          <Button 
            onClick={() => handlePageChange(pagination.page - 1)} 
            disabled={pagination.page === 1}
            variant="outline"
          >
            <ChevronLeft />
          </Button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <Button 
            onClick={() => handlePageChange(pagination.page + 1)} 
            disabled={pagination.page === pagination.totalPages}
            variant="outline"
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSales;
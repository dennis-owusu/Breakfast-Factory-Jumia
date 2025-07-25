import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Filter, ChevronLeft, ChevronRight, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatPrice, formatDate } from '../../utils/helpers';

const OutletSales = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ period: 'all', minAmount: '', maxAmount: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalSales: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalSales: 0, averageSale: 0, saleCount: 0 });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoading(true);
        
        // Build query parameters - removed outletId as it's causing filtering issues
        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit
        });
        
        if (searchInput) queryParams.append('search', searchInput);
        if (filters.period !== 'all') queryParams.append('period', filters.period);
        if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
        if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
        
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
        
        setSales(data.sales);
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
      setError('No outlet found. Please ensure you are logged in.');
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

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Sales</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 truncate">Total Sales</p>
              <p className="text-lg font-medium text-gray-900">{formatPrice(summary.totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 truncate">Average Sale</p>
              <p className="text-lg font-medium text-gray-900">{formatPrice(summary.averageSale)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <ShoppingBag className="h-6 w-6 text-orange-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 truncate">Sale Count</p>
              <p className="text-lg font-medium text-gray-900">{summary.saleCount}</p>
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
          <div className="mt-4 grid grid-cols-3 gap-4">
            <select name="period" value={filters.period} onChange={handleFilterChange} className="p-2 border rounded">
              <option value="all">All Periods</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input name="minAmount" value={filters.minAmount} onChange={handleFilterChange} placeholder="Min Amount" className="p-2 border rounded" />
            <input name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} placeholder="Max Amount" className="p-2 border rounded" />
          </div>
        )}
      </form>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Items</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id} className="border-t">
                <td className="p-4">{formatDate(sale.date)}</td>
                <td className="p-4">{formatPrice(sale.amount)}</td>
                <td className="p-4">{sale.items}</td>
                <td className="p-4"><Badge>{sale.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}><ChevronLeft /></Button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <Button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}><ChevronRight /></Button>
      </div>
    </div>
  );
};

export default OutletSales;
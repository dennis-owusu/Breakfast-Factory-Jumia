import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { outletAPI } from '../../utils/api';

// Real API call to fetch outlet products
const fetchOutletProducts = async (page = 1, limit = 10, search = '', filters = {}) => {
  try {
    // Prepare query parameters
    const params = {
      page,
      limit,
      search: search || undefined,
      category: filters.category || undefined,
      inStock: filters.stock === 'in-stock' ? true : 
               filters.stock === 'out-of-stock' ? false : undefined
    };
    
    // Make API call
    const response = await outletAPI.getOutletProducts(params);
    return response.data;
  } catch (error) {
    console.error('Error fetching outlet products:', error);
    throw new Error('Failed to fetch products. Please try again.');
  }
};

const deleteProduct = async (productId) => {
  try {
    const response = await outletAPI.deleteProduct(productId);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product. Please try again.');
  }
};

const OutletProducts = () => {
  const { user } = useSelector((state) => state.auth);
  const outlet = user?.outlet || {};
  
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalProducts: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    stock: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOutletProducts(pagination.page, pagination.limit, search, filters);
        setProducts(data?.products || []);
        setPagination(data?.pagination || { page: 1, limit: 10, totalProducts: 0, totalPages: 1 });
        setError(null);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
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
  
  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleteLoading(productId);
      await deleteProduct(productId);
      // Remove the deleted product from the list
      setProducts(prev => prev.filter(p => p._id !== productId));
      // Update total count
      setPagination(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1,
        totalPages: Math.ceil((prev.totalProducts - 1) / prev.limit)
      }));
    } catch (err) {
      setError('Failed to delete product. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };
  
  if (isLoading && products.length === 0) {
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
              Products
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your outlet's products
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/outlet/products/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add New Product
            </Link>
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
                    placeholder="Search products..."
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
                {(filters.category || filters.stock || search) && (
                  <button
                    type="button"
                    className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    onClick={() => {
                      setFilters({ category: '', stock: '' });
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
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    id="category"
                    name="category"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Gadgets">Gadgets</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Status</label>
                  <select
                    id="stock"
                    name="stock"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                    value={filters.stock}
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="in-stock">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Products Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading && products.length > 0 ? (
            <div className="p-6 flex justify-center">
              <Loader size="md" />
            </div>
          ) : products.length === 0 ? (
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || filters.category || filters.stock
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new product.'}
              </p>
              <div className="mt-6">
                <Link
                  to="/outlet/products/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Product
                </Link>
              </div>
            </div>
          ) : (
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
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={product.images[0] || 'https://via.placeholder.com/150'}
                              alt={product.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              Added {formatDate(product.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.discountPrice ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{formatPrice(product.discountPrice)}</div>
                            <div className="text-sm text-gray-500 line-through">{formatPrice(product.price)}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">{formatPrice(product.price)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.sold} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.rating} / 5
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/outlet/products/${product._id}/edit`}
                            className="text-orange-500 hover:text-orange-600"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-500 hover:text-red-600"
                            disabled={deleteLoading === product._id}
                          >
                            {deleteLoading === product._id ? (
                              <Loader size="sm" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
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
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.totalProducts)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalProducts}</span> results
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

export default OutletProducts;
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
  Edit,
  Trash2,
  Package
} from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';

// This would be imported from an API utility file in a real app
const fetchProducts = async (params) => {
  // Simulate API call with filtering and pagination
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate 50 products
      const allProducts = Array.from({ length: 50 }, (_, i) => ({
        _id: `product${i + 1}`,
        name: `Product ${i + 1}`,
        description: `This is a description for Product ${i + 1}`,
        price: Math.floor(Math.random() * 100000) + 1000,
        discountPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 50000) + 500 : null,
        stock: Math.floor(Math.random() * 100),
        sold: Math.floor(Math.random() * 200),
        rating: (Math.random() * 3 + 2).toFixed(1),
        numReviews: Math.floor(Math.random() * 50),
        images: [
          `https://picsum.photos/id/${(i * 10) % 1000}/400/400`,
          `https://picsum.photos/id/${(i * 10 + 1) % 1000}/400/400`
        ],
        category: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Books', 'Sports'][Math.floor(Math.random() * 6)],
        brand: ['Brand A', 'Brand B', 'Brand C', 'Brand D'][Math.floor(Math.random() * 4)],
        status: i % 10 === 0 ? 'inactive' : 'active',
        featured: i % 8 === 0,
        outlet: {
          _id: `outlet${Math.floor(i / 5) + 1}`,
          name: `Outlet ${Math.floor(i / 5) + 1}`
        },
        createdAt: new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)).toISOString()
      }));
      
      // Apply search filter
      let filteredProducts = [...allProducts];
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) || 
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.outlet.name.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply category filter
      if (params.category && params.category !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
          product.category.toLowerCase() === params.category.toLowerCase()
        );
      }
      
      // Apply status filter
      if (params.status && params.status !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.status === params.status);
      }
      
      // Apply stock filter
      if (params.stock && params.stock !== 'all') {
        if (params.stock === 'in-stock') {
          filteredProducts = filteredProducts.filter(product => product.stock > 0);
        } else if (params.stock === 'out-of-stock') {
          filteredProducts = filteredProducts.filter(product => product.stock === 0);
        } else if (params.stock === 'low-stock') {
          filteredProducts = filteredProducts.filter(product => product.stock > 0 && product.stock <= 10);
        }
      }
      
      // Apply featured filter
      if (params.featured && params.featured !== 'all') {
        const isFeatured = params.featured === 'featured';
        filteredProducts = filteredProducts.filter(product => product.featured === isFeatured);
      }
      
      // Calculate pagination
      const totalProducts = filteredProducts.length;
      const totalPages = Math.ceil(totalProducts / params.limit);
      const offset = (params.page - 1) * params.limit;
      const paginatedProducts = filteredProducts.slice(offset, offset + params.limit);
      
      resolve({
        products: paginatedProducts,
        pagination: {
          total: totalProducts,
          totalPages,
          currentPage: params.page,
          limit: params.limit
        }
      });
    }, 1000);
  });
};

const updateProductStatus = async (productId, status) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Product status updated to ${status}`
      });
    }, 500);
  });
};

const updateProductFeatured = async (productId, featured) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Product ${featured ? 'marked as featured' : 'removed from featured'}`
      });
    }, 500);
  });
};

const deleteProduct = async (productId) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Product deleted successfully'
      });
    }, 500);
  });
};

const ProductsManagement = () => {
  // State for filters and pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [stock, setStock] = useState('all');
  const [featured, setFeatured] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // State for data
  const [products, setProducts] = useState([]);
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
  
  // Load products based on filters and pagination
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProducts({
          search,
          category,
          status,
          stock,
          featured,
          page,
          limit
        });
        
        setProducts(data.products);
        setPagination(data.pagination);
        setError(null);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [search, category, status, stock, featured, page, limit]);
  
  // Handle search input
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };
  
  // Handle filter changes
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  const handleStockChange = (e) => {
    setStock(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  const handleFeaturedChange = (e) => {
    setFeatured(e.target.value);
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
  
  // Handle product status update
  const handleStatusUpdate = async (productId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this product?`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      const result = await updateProductStatus(productId, newStatus);
      
      if (result.success) {
        // Update local state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === productId ? { ...product, status: newStatus } : product
          )
        );
        
        setSuccessMessage(result.message);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to update product status. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle product featured update
  const handleFeaturedUpdate = async (productId, isFeatured) => {
    if (!window.confirm(`Are you sure you want to ${isFeatured ? 'feature' : 'unfeature'} this product?`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      const result = await updateProductFeatured(productId, isFeatured);
      
      if (result.success) {
        // Update local state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === productId ? { ...product, featured: isFeatured } : product
          )
        );
        
        setSuccessMessage(result.message);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to update product featured status. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle product delete
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const result = await deleteProduct(productId);
      
      if (result.success) {
        // Update local state
        setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
          totalPages: Math.ceil((prev.total - 1) / limit)
        }));
        
        setSuccessMessage(result.message);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to delete product. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setActionLoading(false);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Products Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all products on the platform
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
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
                    placeholder="Search by name, description, category, brand, or outlet"
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>
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
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              {/* Stock Filter */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
                <select
                  id="stock"
                  name="stock"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  value={stock}
                  onChange={handleStockChange}
                >
                  <option value="all">All Stock</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="low-stock">Low Stock (≤10)</option>
                </select>
              </div>
              
              {/* Featured Filter */}
              <div>
                <label htmlFor="featured" className="block text-sm font-medium text-gray-700">Featured</label>
                <select
                  id="featured"
                  name="featured"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  value={featured}
                  onChange={handleFeaturedChange}
                >
                  <option value="all">All Products</option>
                  <option value="featured">Featured Only</option>
                  <option value="not-featured">Not Featured</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Products Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading && products.length > 0 && (
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
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category / Brand
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock / Sold
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outlet
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No products found matching your criteria
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-md object-cover" src={product.images[0]} alt={product.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">{product.description}</div>
                            {product.featured && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category}</div>
                        <div className="text-sm text-gray-500">{product.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.discountPrice ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{formatPrice(product.discountPrice)}</div>
                            <div className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">{formatPrice(product.price)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Stock: {product.stock === 0 ? (
                            <span className="text-red-600 font-medium">Out of stock</span>
                          ) : product.stock <= 10 ? (
                            <span className="text-yellow-600 font-medium">{product.stock} (Low)</span>
                          ) : (
                            <span>{product.stock}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">Sold: {product.sold}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-sm text-gray-600">{product.rating} ({product.numReviews})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.outlet.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/admin/products/${product._id}`} 
                            className="text-orange-600 hover:text-orange-900"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          
                          <Link 
                            to={`/admin/products/${product._id}/edit`} 
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Product"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(product._id, product.status === 'active' ? 'inactive' : 'active')}
                            disabled={actionLoading}
                            className={`${product.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={product.status === 'active' ? 'Deactivate Product' : 'Activate Product'}
                          >
                            {product.status === 'active' ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleFeaturedUpdate(product._id, !product.featured)}
                            disabled={actionLoading}
                            className={`text-yellow-600 hover:text-yellow-900 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={product.featured ? 'Remove from Featured' : 'Mark as Featured'}
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product._id)}
                            disabled={actionLoading}
                            className={`text-red-600 hover:text-red-900 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Delete Product"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
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

export default ProductsManagement;
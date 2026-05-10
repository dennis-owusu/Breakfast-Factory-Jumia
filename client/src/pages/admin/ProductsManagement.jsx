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

// Fetch products from API
const fetchProducts = async (params) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams({
      startIndex: ((params.page - 1) * params.limit).toString(),
      limit: params.limit.toString(),
      searchTerm: params.search || '',
      category: params.category !== 'all' ? params.category : '',
      featured: params.featured !== 'all' ? params.featured === 'featured' : ''
    });

    const response = await fetch(`/api/route/allproducts?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    
    // Transform the response to match our component's expectations
    return {
      products: data.products.map(product => ({
        _id: product._id,
        name: product.productName,
        description: product.description,
        price: product.productPrice,
        discountPrice: product.discountPrice,
        stock: product.numberOfProductsAvailable,
        images: [product.productImage],
        category: product.category?.categoryName || 'Uncategorized',
        featured: product.featured,
        outlet: product.outlet,
        createdAt: product.createdAt
      })),
      pagination: {
        total: data.totalProducts,
        totalPages: Math.ceil(data.totalProducts / params.limit),
        currentPage: params.page,
        limit: params.limit
      }
    };
  } catch (error) {
    throw new Error('Failed to fetch products: ' + error.message);
  }
};

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [featured, setFeatured] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [search, category, featured, status, page]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search,
        category,
        featured,
        status,
        page,
        limit: 10
      };
      const result = await fetchProducts(params);
      setProducts(result.products);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  // Helper function to get status badge color with dark mode
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Helper function to get stock status with dark mode
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' };
    } else if (stock < 10) {
      return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' };
    } else {
      return { label: 'In Stock', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' };
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
            Products Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all products on the platform
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          {loading && products.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Loader size="lg" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading products...</p>
            </div>
          ) : !loading && products.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No products found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                              {product.images && product.images[0] ? (
                                <img src={product.images[0]} alt={product.name} className="h-10 w-10 object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {product.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{formatPrice(product.price)}</div>
                          {product.discountPrice && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              {formatPrice(product.discountPrice)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.className}`}>
                            {stockStatus.label} ({product.stock})
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(product.status)}`}>
                            {product.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/admin/products/${product._id}`}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                              title="View"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/admin/products/${product._id}/edit`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsManagement;

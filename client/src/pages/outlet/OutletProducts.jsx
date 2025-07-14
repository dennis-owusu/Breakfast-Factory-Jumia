import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ShoppingBag, Plus, Search, ArrowUpDown, Trash2, Edit, Eye } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'react-hot-toast';

const OutletProducts = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // Fallback categories
  const fallbackCategories = [
    { _id: '1', name: 'Electronics', stringId: 'electronics' },
    { _id: '2', name: 'Clothing', stringId: 'clothing' },
    { _id: '3', name: 'Food', stringId: 'food' },
    { _id: '4', name: 'Furniture', stringId: 'furniture' },
    { _id: '5', name: 'Beauty', stringId: 'beauty' },
    { _id: '6', name: 'Health', stringId: 'health' },
    { _id: '7', name: 'Sports', stringId: 'sports' },
    { _id: '8', name: 'Books', stringId: 'books' },
    { _id: '9', name: 'Toys', stringId: 'toys' },
    { _id: '10', name: 'Other', stringId: 'other' }
  ];

  // Fetch categories
 /*  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/route/allcategories');
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON, received HTML or other content');
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch categories');
        }
        setCategories(Array.isArray(result.categories) ? result.categories : fallbackCategories);
      } catch (err) {
        console.error('Fetch categories error:', err.message);
        setError(err.message);
        toast.error(err.message);
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);
 */
  // Fetch products with search, sort, and filter
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          startIndex: (currentPage - 1) * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
          searchTerm: searchTerm,
          order: sortBy.includes('asc') ? 'asc' : 'desc',
          sort: sortBy.includes('price') ? 'productPrice' : sortBy.includes('name') ? 'productName' : sortBy.includes('category') ? 'category' : 'updatedAt',
          category: categoryFilter === 'all' ? '' : categoryFilter
        });
        const response = await fetch(`/api/route/allproducts`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON, received HTML or other content');
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch products');
        }
        setProducts(Array.isArray(result.products) ? result.products : []);
        setTotalProducts(result.totalProducts || 0);
        setTotalPages(Math.ceil(result.totalProducts / ITEMS_PER_PAGE) || 1);
      } catch (err) {
        console.error('Fetch products error:', err.message);
        setError(err.message);
        toast.error(err.message);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchTerm, sortBy, categoryFilter, currentPage]);

  // Handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page on sort
  };

  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1); // Reset to first page on filter
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/route/delete/${productToDelete._id}`, {
        method: 'DELETE'
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
        throw new Error(result.message || 'Failed to delete product');
      }
      setProducts(products.filter(p => p._id !== productToDelete._id));
      toast.success('Product deleted successfully');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Delete product error:', err.message);
      setError(err.message);
      toast.error(err.message);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
          <Button 
            onClick={() => navigate('/outlet/product/new')} 
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.isArray(categories) && categories.map(category => (
                  <SelectItem key={category._id} value={category._id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
                <SelectItem value="category-asc">Category: A to Z</SelectItem>
                <SelectItem value="category-desc">Category: Z to A</SelectItem>
                <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
                <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader size="lg" />
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center cursor-pointer" onClick={() => handleSortChange(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}>
                        Product
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center cursor-pointer" onClick={() => handleSortChange(sortBy === 'category-asc' ? 'category-desc' : 'category-asc')}>
                        Category
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center cursor-pointer" onClick={() => handleSortChange(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')}>
                        Price
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center cursor-pointer" onClick={() => handleSortChange(sortBy === 'stock-asc' ? 'stock-desc' : 'stock-asc')}>
                        Stock
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img className="h-10 w-10 rounded-md object-cover" src={product.productImage} alt={product.productName} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₦{product.productPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.numberOfProductsAvailable > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.numberOfProductsAvailable > 0 ? `${product.numberOfProductsAvailable} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            onClick={() => navigate(`/product/${product._id}`)} 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => navigate(`/outlet/product/${product._id}/edit`)} 
                            variant="outline" 
                            size="sm" 
                            className="text-amber-600 hover:text-amber-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteClick(product)} 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 mb-6">Get started by creating your first product</p>
              <Button 
                onClick={() => navigate('/outlet/product/new')} 
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Product
              </Button>
            </div>
          )}

          {/* Pagination */}
          {products.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}</span> of{' '}
                    <span className="font-medium">{totalProducts}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page ? 'text-orange-600 bg-orange-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-medium">{productToDelete?.productName}</span>? This action cannot be undone.
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

export default OutletProducts;
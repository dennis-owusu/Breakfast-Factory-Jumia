import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertCircle,
  ShoppingBag,
  Plus,
  Search,
  ArrowUpDown,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { toast } from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

const OutletProducts = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/route/allcategories');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch categories');
        setCategories(Array.isArray(data.allCategory) ? data.allCategory : []);
      } catch (err) {
        toast.error('Error loading categories');
        setCategories([]);
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          startIndex: (currentPage - 1) * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
          ...(searchTerm && { searchTerm }),
          order: sortBy.includes('asc') ? 'asc' : 'desc',
          sort: sortBy.includes('price') ? 'productPrice' :
                sortBy.includes('name') ? 'productName' :
                sortBy.includes('category') ? 'category' :
                sortBy.includes('stock') ? 'numberOfProductsAvailable' : 'updatedAt',
          ...(categoryFilter !== 'all' && { category: categoryFilter })
        });
        const res = await fetch(`/api/route/allproducts?${queryParams.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch products');
        setProducts(Array.isArray(data.products) ? data.products : []);
        setTotalProducts(data.totalProducts || 0);
        setTotalPages(Math.ceil((data.totalProducts || 0) / ITEMS_PER_PAGE));
      } catch (err) {
        console.error(err);
        toast.error('Error loading products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchTerm, sortBy, categoryFilter, currentPage]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Button
          onClick={() => navigate('/outlet/product/new')}
          className="bg-orange-500 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category.categoryName}>
                {category.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A-Z</SelectItem>
            <SelectItem value="name-desc">Name: Z-A</SelectItem>
            <SelectItem value="category-asc">Category: A-Z</SelectItem>
            <SelectItem value="category-desc">Category: Z-A</SelectItem>
            <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
            <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleClearFilters} variant="outline">
          Clear Filters
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader size="lg" />
        </div>
      ) : products.length > 0 ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-medium text-gray-600 uppercase">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={product.productImage || 'https://via.placeholder.com/40'}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold">{product.productName}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {product.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{product.category}</td>
                  <td className="p-3 text-sm">₦{product.productPrice.toFixed(2)}</td>
                  <td className="p-3 text-sm">{product.numberOfProductsAvailable}</td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/outlet/product/${product._id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/outlet/product/${product._id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDeleteModalOpen(true);
                        setProductToDelete(product);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <ShoppingBag className="mx-auto h-12 w-12 mb-2" />
          <p>No products found. Add your first product to get started.</p>
        </div>
      )}
    </div>
  );
};

export default OutletProducts;

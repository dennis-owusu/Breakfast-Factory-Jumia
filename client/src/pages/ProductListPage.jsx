import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import Loader from '../components/ui/Loader';
import { toast } from 'react-hot-toast';

const ProductListPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    sort: 'name',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/route/allcategories');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      toast.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ...filters,
        category: filters.category === 'all' ? '' : filters.category,
        page: pagination.page,
        limit: pagination.limit,
      }).toString();
      const response = await fetch(`/api/route/allproducts?${query}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response: Expected JSON');
      }
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
        setPagination((prev) => ({ ...prev, total: data.total || 0 }));
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError(err.message);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    if (name === 'priceRange') {
      setFilters((prev) => ({ ...prev, minPrice: value.minPrice, maxPrice: value.maxPrice }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const applyFilters = () => {
    navigate(`?${new URLSearchParams({ ...filters, page: 1 }).toString()}`);
    setIsFilterOpen(false);
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      navigate(`?${new URLSearchParams({ ...filters, page: newPage }).toString()}`);
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={pagination.page === i ? 'default' : 'outline'}
          className={`mx-1 ${pagination.page === i ? 'bg-orange-500 text-white' : 'text-gray-700'}`}
          onClick={() => changePage(i)}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8">
        <Button
          variant="outline"
          disabled={pagination.page === 1}
          onClick={() => changePage(pagination.page - 1)}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages}
        <Button
          variant="outline"
          disabled={pagination.page >= totalPages}
          onClick={() => changePage(pagination.page + 1)}
          className="ml-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-4">Filters</h2>
          <div className="mb-4">
            <Label htmlFor="search" className="text-sm font-medium">Search</Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="mb-4">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-4">
            <Label className="text-sm font-medium">Price Range (₦)</Label>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              min={0}
              max={10000}
              step={100}
              onValueChange={(v) => handleFilterChange('priceRange', { minPrice: v[0], maxPrice: v[1] })}
              className="mt-2"
            />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>₦{filters.minPrice.toLocaleString()}</span>
              <span>₦{filters.maxPrice.toLocaleString()}</span>
            </div>
          </div>
          <div className="mb-4">
            <Label className="text-sm font-medium">Minimum Rating</Label>
            <div className="flex items-center space-x-2 mt-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <Checkbox
                  key={r}
                  checked={filters.minRating >= r}
                  onCheckedChange={() => handleFilterChange('minRating', r)}
                >
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </Checkbox>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <Label className="text-sm font-medium">Sort By</Label>
            <Select value={filters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="-price">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={applyFilters} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Apply Filters
          </Button>
        </div>

        <div className="md:w-3/4">
          {products.length === 0 ? (
            <div className="text-center text-gray-500">No products found</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard   product={{
                    _id: product._id,
                    productName: product.productName,
                    productPrice: product.productPrice,
                    images: [product.productImage], // Convert single image string to array
                    discountPrice: product.discountPrice,
                  }} />
              ))}
            </div>
          )}
          {renderPagination()}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
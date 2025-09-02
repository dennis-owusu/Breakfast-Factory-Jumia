import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Star, ChevronLeft, ChevronRight, X, Grid, List, SlidersHorizontal } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    sort: 'name',
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const BASE_URL = 'http://localhost:3000';

  // Initialize filters from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFilters = {};
    
    if (params.has('search')) urlFilters.search = params.get('search');
    if (params.has('category')) urlFilters.category = params.get('category');
    if (params.has('minPrice')) urlFilters.minPrice = Number(params.get('minPrice'));
    if (params.has('maxPrice')) urlFilters.maxPrice = Number(params.get('maxPrice'));
    if (params.has('minRating')) urlFilters.minRating = Number(params.get('minRating'));
    if (params.has('sort')) urlFilters.sort = params.get('sort');
    if (params.has('page')) setPagination(prev => ({ ...prev, page: Number(params.get('page')) }));
    
    if (Object.keys(urlFilters).length > 0) {
      const newFilters = { ...filters, ...urlFilters };
      setFilters(newFilters);
      setTempFilters(newFilters);
    }
    
    fetchCategories();
  }, [location.search]);
  
  // Fetch products when filters or pagination changes
  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/route/allcategories`);
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
      const response = await fetch(`${BASE_URL}/api/route/allproducts?${query}`);
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
      setTempFilters((prev) => ({ ...prev, minPrice: value.minPrice, maxPrice: value.maxPrice }));
    } else {
      setTempFilters((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTempFilters((prev) => ({ ...prev, search: value }));
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    navigate(`?${new URLSearchParams({ ...tempFilters, page: 1 }).toString()}`);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      category: 'all',
      minPrice: 0,
      maxPrice: 5000, // Updated to a more reasonable max price for coffee shop
      minRating: 0,
      sort: 'name',
    };
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    navigate('?');
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      navigate(`?${new URLSearchParams({ ...filters, page: newPage }).toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          variant="outline"
          className="mx-1 hover:bg-amber-50 dark:hover:bg-amber-900"
          onClick={() => changePage(1)}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(<span key="start-ellipsis" className="mx-2 text-gray-500 dark:text-gray-400">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={pagination.page === i ? 'default' : 'outline'}
          className={`mx-1 ${
            pagination.page === i 
              ? 'bg-amber-800 hover:bg-amber-900 text-white border-amber-800' 
              : 'hover:bg-amber-100 dark:hover:bg-amber-900'
          }`}
          onClick={() => changePage(i)}
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className="mx-2 text-gray-500 dark:text-gray-400">...</span>);
      }
      pages.push(
        <Button
          key={totalPages}
          variant="outline"
          className="mx-1 hover:bg-amber-50 dark:hover:bg-amber-900"
          onClick={() => changePage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8 py-4">
        <Button
          variant="outline"
          disabled={pagination.page === 1}
          onClick={() => changePage(pagination.page - 1)}
          className="mr-2 hover:bg-amber-50 dark:hover:bg-amber-900 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1">Previous</span>
        </Button>
        <div className="flex items-center">{pages}</div>
        <Button
          variant="outline"
          disabled={pagination.page >= totalPages}
          onClick={() => changePage(pagination.page + 1)}
          className="ml-2 hover:bg-amber-50 dark:hover:bg-amber-900 disabled:opacity-50"
        >
          <span className="mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (loading) return <Loader />;
  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-red-500 dark:text-red-400 text-lg font-medium mb-4">{error}</div>
        <Button 
          onClick={fetchProducts} 
          className="bg-amber-800 hover:bg-amber-900 text-white"
        >
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative max-w-2xl mx-auto">
              <Input
                placeholder="Search for products, brands and categories..."
                value={tempFilters.search}
                onChange={handleSearchChange}
                className="pl-12 pr-4 py-3 text-base border-2 border-amber-200 dark:border-amber-800 focus:border-amber-500 dark:focus:border-amber-400 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-amber-800 hover:bg-amber-900 px-6 py-2 rounded-md text-white"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Breadcrumb and Results Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="text-sm text-gray-600 dark:text-gray-400">
                <span className="hover:text-gray-900 dark:hover:text-white">Home</span>
                <span className="mx-2">›</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">Products</span>
              </nav>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {pagination.total > 0 ? 
                  `${pagination.total} product${pagination.total > 1 ? 's' : ''} found` : 
                  'No products found'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-100 dark:bg-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                className="lg:hidden border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900 text-gray-900 dark:text-gray-100"
                onClick={() => setIsFilterOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className={`${
            isFilterOpen ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden'
          } lg:block w-full lg:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-fit lg:sticky lg:top-24`}>
            
            {/* Mobile Overlay */}
            {isFilterOpen && (
              <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsFilterOpen(false)} />
            )}
            
            {/* Filter Panel */}
            <div className={`${
              isFilterOpen ? 'fixed right-0 top-0 w-80 h-full overflow-y-auto bg-white dark:bg-gray-800 z-50 lg:relative lg:w-full' : ''
            } lg:relative`}>
              
              {/* Filter Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden text-gray-500 dark:text-gray-400"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">Category</Label>
                  <Select value={tempFilters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem 
                        value="all" 
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        All Categories
                      </SelectItem>
                      {categories.map((cat) => (
                        <SelectItem 
                          key={cat._id} 
                          value={cat._id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">Price Range</Label>
                  <Slider
                    value={[tempFilters.minPrice, tempFilters.maxPrice]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => handleFilterChange('priceRange', { minPrice: v[0], maxPrice: v[1] })}
                    className="mb-3 [&>span]:bg-amber-500"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      ₵{tempFilters.minPrice.toLocaleString()}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      ₵{tempFilters.maxPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">Customer Rating</Label>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-2 -m-2">
                        <Checkbox
                          checked={tempFilters.minRating >= rating}
                          onCheckedChange={() => handleFilterChange('minRating', tempFilters.minRating >= rating ? 0 : rating)}
                          className="mr-3 border-gray-300 dark:border-gray-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${
                                star <= rating 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-300 dark:text-gray-600'
                              }`} 
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">& Up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">Sort By</Label>
                  <Select value={tempFilters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem 
                        value="name"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        Name (A-Z)
                      </SelectItem>
                      <SelectItem 
                        value="-name"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        Name (Z-A)
                      </SelectItem>
                      <SelectItem 
                        value="price"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        Price: Low to High
                      </SelectItem>
                      <SelectItem 
                        value="-price"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        Price: High to Low
                      </SelectItem>
                      <SelectItem 
                        value="-rating"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        Top Rated
                      </SelectItem>
                      <SelectItem 
                        value="rating"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        Lowest Rated
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Apply Filters Button */}
                <Button 
                  onClick={applyFilters} 
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white py-3 font-medium"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button 
                  onClick={clearFilters} 
                  variant="outline" 
                  className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <div 
                      key={product._id} 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 overflow-hidden group"
                    >
                      <ProductCard
                        product={{
                          _id: product._id,
                          productName: product.productName,
                          productPrice: product.productPrice,
                          images: [`${BASE_URL}${product.productImage}`],
                          discountPrice: product.discountPrice,
                        }}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>
                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
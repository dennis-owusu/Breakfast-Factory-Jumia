import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import Loader from '../components/ui/Loader';
import { ChevronLeft, ChevronRight, Filter, X, SlidersHorizontal } from 'lucide-react';
import { generatePagination } from '../utils/helpers';

const ProductListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Get query parameters
  const initialCategory = queryParams.get('category') || '';
  const initialSearch = queryParams.get('search') || '';
  const initialMinPrice = queryParams.get('minPrice') || '';
  const initialMaxPrice = queryParams.get('maxPrice') || '';
  const initialSort = queryParams.get('sort') || 'newest';
  const initialPage = parseInt(queryParams.get('page') || '1', 10);

  // Local state for filters
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);
  const [showFilters, setShowFilters] = useState(false);

  // Get products and categories from Redux store
  const { products, categories, totalProducts, totalPages, currentPage, isLoading, error } = 
    useSelector((state) => state.products);

  // Fetch products and categories on component mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch products when filters change
  useEffect(() => {
    const params = {
      page,
      limit: 12,
      category,
      search,
      minPrice,
      maxPrice,
      sort
    };

    dispatch(fetchProducts(params));

    // Update URL with filters
    const searchParams = new URLSearchParams();
    if (category) searchParams.set('category', category);
    if (search) searchParams.set('search', search);
    if (minPrice) searchParams.set('minPrice', minPrice);
    if (maxPrice) searchParams.set('maxPrice', maxPrice);
    if (sort) searchParams.set('sort', sort);
    if (page > 1) searchParams.set('page', page.toString());

    navigate({
      pathname: '/products',
      search: searchParams.toString()
    }, { replace: true });

  }, [dispatch, category, search, minPrice, maxPrice, sort, page, navigate]);

  // Handle filter changes
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleMinPriceChange = (e) => {
    setMinPrice(e.target.value);
  };

  const handleMaxPriceChange = (e) => {
    setMaxPrice(e.target.value);
  };

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleClearFilters = () => {
    setCategory('');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Generate pagination numbers
  const paginationNumbers = generatePagination(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600 mt-1">
            {totalProducts} products found
            {category && Array.isArray(categories) && categories.find(c => c._id === category)?.name 
              ? ` in ${categories.find(c => c._id === category).name}` 
              : category ? ' in selected category' : ''}
            {search && ` matching "${search}"`}
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Mobile filter button */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <button
              onClick={toggleFilters}
              className="flex items-center text-gray-700 hover:text-orange-500"
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            <div className="flex items-center">
              <label htmlFor="mobile-sort" className="mr-2 text-gray-700">Sort:</label>
              <select
                id="mobile-sort"
                value={sort}
                onChange={handleSortChange}
                className="border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Filters sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:col-span-1 mb-6 lg:mb-0`}>
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  Clear All
                </button>
              </div>

              {/* Category filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Category</h3>
                {error ? (
                  <p className="text-red-600 text-sm">Error loading categories: {error}</p>
                ) : isLoading && (!Array.isArray(categories) || categories.length === 0) ? (
                  <div className="flex justify-center">
                    <Loader size="sm" />
                  </div>
                ) : Array.isArray(categories) && categories.length > 0 ? (
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-600 text-sm">No categories available</p>
                )}
              </div>

              {/* Price filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Price Range</h3>
                <form onSubmit={handlePriceSubmit} className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    className="w-full border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    className="w-full border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                  />
                  <button
                    type="submit"
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                  >
                    <Filter className="h-4 w-4 text-gray-600" />
                  </button>
                </form>
              </div>

              {/* Search filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Search</h3>
                <form onSubmit={handleSearchSubmit} className="flex">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full border-gray-300 rounded-l-md focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="bg-orange-500 text-white px-3 rounded-r-md hover:bg-orange-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>

              {/* Applied filters */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Applied Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {category && (
                    <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                      Category: {Array.isArray(categories) && categories.find(c => c._id === category)?.name || 'Selected'}
                      <button
                        onClick={() => setCategory('')}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {search && (
                    <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                      Search: {search}
                      <button
                        onClick={() => setSearch('')}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {minPrice && (
                    <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                      Min Price: ₵{minPrice}
                      <button
                        onClick={() => setMinPrice('')}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {maxPrice && (
                    <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                      Max Price: ₵{maxPrice}
                      <button
                        onClick={() => setMaxPrice('')}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product grid */}
          <div className="lg:col-span-3">
            {/* Desktop sort options */}
            <div className="hidden lg:flex justify-end mb-4">
              <div className="flex items-center">
                <label htmlFor="desktop-sort" className="mr-2 text-gray-700">Sort by:</label>
                <select
                  id="desktop-sort"
                  value={sort}
                  onChange={handleSortChange}
                  className="border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Products */}
            {error ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-lg font-medium text-red-600 mb-2">Error loading products</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleClearFilters}
                  className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                >
                  Clear All Filters
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader size="lg" />
              </div>
            ) : Array.isArray(products) && products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria to find what you're looking for.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(products) && products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="mr-2 p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {paginationNumbers.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-md ${pageNum === currentPage
                          ? 'bg-orange-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-2 p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import Loader from '../components/ui/Loader';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';
import { addToCart } from '../redux/slices/cartSlice';
import img1 from "../assets/cf.jpg"
import img2 from "../assets/cof.jpg"
import img3 from "../assets/cof1.jpg"

// Hero banner carousel images
const heroBanners = [
  {
    title: 'Shop the Best Deals on Breakfast Factory',
    subtitle: 'Discover amazing products at unbeatable prices. Free delivery on orders over ₦100.',
    image: img1,
    cta: '/products',
    ctaText: 'Shop Now',
  },
  {
    title: 'Exclusive Electronics Sale',
    subtitle: 'Up to 50% off on smartphones, laptops, and more!',
    image: img2,
    cta: '/products?category=electronics',
    ctaText: 'Explore Deals',
  },
  {
    title: 'New Fashion Arrivals',
    subtitle: 'Check out our latest collection of trendy outfits.',
    image:  img3,
    cta: '/products?category=fashion',
    ctaText: 'Shop Fashion',
  },
];

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState({ categories: true, featured: true, bestSellers: true });
  const [error, setError] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading((prev) => ({ ...prev, categories: true }));
        const response = await fetch('http://localhost:3000/api/route/allcategories');
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON');
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch categories');
        }
        setCategories(data.categories || []);
        setError(null);
      } catch (err) {
        console.error('Fetch categories error:', err.message);
        setError('Failed to load categories. Please try again.');
        toast.error('Failed to load categories');
      } finally {
        setLoading((prev) => ({ ...prev, categories: false }));
      }
    };

    fetchCategories();
  }, []);

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading((prev) => ({ ...prev, featured: true }));
        const response = await fetch('http://localhost:3000/api/route/allproducts?featured=true');
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON');
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch products');
        }
        setFeaturedProducts(data.products || []);
        setError(null);
      } catch (err) {
        console.error('Fetch featured products error:', err.message);
        setError('Failed to load featured products. Please try again.');
        toast.error('Failed to load featured products');
      } finally {
        setLoading((prev) => ({ ...prev, featured: false }));
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Fetch best sellers
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading((prev) => ({ ...prev, bestSellers: true }));
        const response = await fetch('http://localhost:3000/api/route/allproducts?sort=numberOfProductsAvailable&order=desc');
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON');
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch best sellers');
        }
        setBestSellers(data.products.slice(0, 8) || []);
        setError(null);
      } catch (err) {
        console.error('Fetch best sellers error:', err.message);
        setError('Failed to load best sellers. Please try again.');
        toast.error('Failed to load best sellers');
      } finally {
        setLoading((prev) => ({ ...prev, bestSellers: false }));
      }
    };

    fetchBestSellers();
  }, []);

  // Auto-rotate hero banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Add to cart
  const handleAddToCart = (product) => {
    try {
      dispatch(addToCart({
        _id: product._id,
        productName: product.productName,
        productPrice: product.productPrice,
        images: [product.productImage],
        outlet: product.outlet || { name: 'Unknown Outlet' },
        quantity: 1,
      }));
      toast.success(`${product.productName} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err.message);
      toast.error('Failed to add product to cart');
    }
  };

  // Hero banner section with carousel
  const HeroBanner = () => (
    <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {heroBanners[currentBanner].title}
            </h1>
            <p className="text-lg md:text-xl mb-6">
              {heroBanners[currentBanner].subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={heroBanners[currentBanner].cta}
                className="bg-white text-orange-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                {heroBanners[currentBanner].ctaText}
              </Link>
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                Join Today
              </Link>
            </div>
          </div>
          <div className="hidden md:block relative">
            <img
              src={heroBanners[currentBanner].image}
              alt={heroBanners[currentBanner].title}
              className="rounded-lg shadow-lg w-full h-[400px] object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {heroBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-2 w-2 rounded-full ${
                    currentBanner === index ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Categories section
  const CategoriesSection = () => (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Link to="/products" className="text-orange-600 flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        {loading.categories ? (
          <div className="flex justify-center py-12">
            <Loader size="md" />
          </div>
        ) : error && loading.categories === false ? (
          <div className="text-center py-12 text-red-600">
            {error}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <CategoryCard
                key={category._id}
                category={{
                  _id: category._id,
                  name: category.name,
                  image: category.image || 'https://via.placeholder.com/150',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            No categories available.
          </div>
        )}
      </div>
    </section>
  );

  // Featured products section
  const FeaturedProductsSection = () => (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-orange-600 flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        {loading.featured ? (
          <div className="flex justify-center py-12">
            <Loader size="md" />
          </div>
        ) : error && loading.featured === false ? (
          <div className="text-center py-12 text-red-600">
            {error}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <div key={product._id} className="relative">
                <ProductCard
                product={{
                  _id: product._id,
                  productName: product.productName,
                  productPrice: product.productPrice,
                  images: [product.productImage],
                  discountPrice: product.discountPrice,
                }}
                onAddToCart={() => handleAddToCart(product)}
              />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            No featured products available.
          </div>
        )}
      </div>
    </section>
  );

  // Best sellers section
  const BestSellersSection = () => (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
          <Link to="/products" className="text-orange-600 flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        {loading.bestSellers ? (
          <div className="flex justify-center py-12">
            <Loader size="md" />
          </div>
        ) : error && loading.bestSellers === false ? (
          <div className="text-center py-12 text-red-600">
            {error}
          </div>
        ) : bestSellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bestSellers.slice(0, 8).map((product) => (
              <div key={product._id} className="relative">
                <ProductCard
                  product={{
                    _id: product._id,
                    productName: product.productName,
                    productPrice: product.productPrice,
                    images: [product.productImage],
                    discountPrice: product.discountPrice,
                  }}
                  onAddToCart={() => handleAddToCart(product)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            No best sellers available.
          </div>
        )}
      </div>
    </section>
  );

  // Promotional banners section
  const PromotionalBanners = () => (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative rounded-lg overflow-hidden h-64">
            <img
              src="https://via.placeholder.com/800x400?text=Flash+Sale"
              alt="Flash sale banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center p-8">
              <h3 className="text-white text-2xl font-bold mb-2">Flash Sale</h3>
              <p className="text-white text-lg mb-4">Up to 50% off on electronics</p>
              <Link
                to="/products?category=electronics"
                className="bg-white text-orange-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors inline-block w-max"
              >
                Shop Now
              </Link>
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden h-64">
            <img
              src="https://via.placeholder.com/800x400?text=New+Arrivals"
              alt="New arrivals banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center p-8">
              <h3 className="text-white text-2xl font-bold mb-2">New Arrivals</h3>
              <p className="text-white text-lg mb-4">Check out our latest fashion collection</p>
              <Link
                to="/products?category=fashion"
                className="bg-white text-orange-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors inline-block w-max"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Features section
  const FeaturesSection = () => (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg">
            <div className="bg-orange-100 p-3 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Free Delivery</h3>
            <p className="text-gray-600">Free delivery on all orders over ₦100</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg">
            <div className="bg-orange-100 p-3 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
            <p className="text-gray-600">100% secure payment processing</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg">
            <div className="bg-orange-100 p-3 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Returns</h3>
            <p className="text-gray-600">30-day return policy for all items</p>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      <HeroBanner />
      <CategoriesSection />
      <FeaturedProductsSection />
      <BestSellersSection />
      <PromotionalBanners />
      <FeaturesSection />
    </div>
  );
};

export default HomePage;
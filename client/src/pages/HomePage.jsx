import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import Loader from '../components/ui/Loader';
import { ChevronRight } from 'lucide-react';

// Mock data to replace Redux state
const mockCategories = [
  { _id: '1', name: 'Electronics', image: 'https://via.placeholder.com/150' },
  { _id: '2', name: 'Fashion', image: 'https://via.placeholder.com/150' },
  { _id: '3', name: 'Home & Garden', image: 'https://via.placeholder.com/150' },
  { _id: '4', name: 'Sports', image: 'https://via.placeholder.com/150' },
  { _id: '5', name: 'Books', image: 'https://via.placeholder.com/150' },
  { _id: '6', name: 'Toys', image: 'https://via.placeholder.com/150' },
];

const mockFeaturedProducts = [
  { _id: '1', name: 'Smartphone', price: 599.99, image: 'https://via.placeholder.com/300' },
  { _id: '2', name: 'Laptop', price: 999.99, image: 'https://via.placeholder.com/300' },
  { _id: '3', name: 'Headphones', price: 99.99, image: 'https://via.placeholder.com/300' },
  { _id: '4', name: 'Smartwatch', price: 199.99, image: 'https://via.placeholder.com/300' },
  { _id: '5', name: 'Tablet', price: 349.99, image: 'https://via.placeholder.com/300' },
  { _id: '6', name: 'Camera', price: 499.99, image: 'https://via.placeholder.com/300' },
  { _id: '7', name: 'Speaker', price: 79.99, image: 'https://via.placeholder.com/300' },
  { _id: '8', name: 'Gaming Console', price: 399.99, image: 'https://via.placeholder.com/300' },
];

const HomePage = () => {
  // Hero banner section
  const HeroBanner = () => (
    <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Shop the Best Deals on Breakfast Factory
            </h1>
            <p className="text-lg md:text-xl mb-6">
              Discover amazing products at unbeatable prices. Free delivery on orders over ₵100.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/products" 
                className="bg-white text-orange-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
              <Link 
                to="/register" 
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                Join Today
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://via.placeholder.com/600x400" 
              alt="Shopping banner" 
              className="rounded-lg shadow-lg"
            />
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
          <Link to="/products" className="text-orange-600 flex items-center">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {mockCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mockCategories.slice(0, 6).map((category) => (
              <CategoryCard key={category._id} category={category} />
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
          <Link to="/products" className="text-orange-600 flex items-center">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {mockFeaturedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mockFeaturedProducts.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
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

  // Promotional banners section
  const PromotionalBanners = () => (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative rounded-lg overflow-hidden h-64">
            <img 
              src="https://via.placeholder.com/800x400" 
              alt="Special offer" 
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
              src="https://via.placeholder.com/800x400" 
              alt="New arrivals" 
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Free Delivery</h3>
            <p className="text-gray-600">Free delivery on all orders over ₵100</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg">
            <div className="bg-orange-100 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
            <p className="text-gray-600">100% secure payment processing</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg">
            <div className="bg-orange-100 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
      <HeroBanner />
      <CategoriesSection />
      <FeaturedProductsSection />
      <PromotionalBanners />
      <FeaturesSection />
    </div>
  );
};

export default HomePage;
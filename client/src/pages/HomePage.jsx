import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Clock, Star, ShoppingCart, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Placeholder components and assets for a complete, runnable example.
const ProductCard = ({ product, onAddToCart }) => {
  const price = product.discountPrice || product.productPrice;
  const oldPrice = product.discountPrice ? product.productPrice : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 group">
      <Link to={`/product/${product._id}`}>
        <img
          src={product.images[0] || "https://placehold.co/400x400/E5E7EB/6B7280?text=Product+Image"}
          alt={product.productName}
          className="w-full h-48 object-cover object-center"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/E5E7EB/6B7280?text=Product+Image"; }}
        />
      </Link>
      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">{product.productName}</h3>
        </Link>
        <div className="flex items-baseline mb-2">
          <p className="text-lg font-bold text-orange-600">₦{price?.toLocaleString()}</p>
          {oldPrice && (
            <p className="text-xs text-gray-500 line-through ml-2">₦{oldPrice?.toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
          <span>4.5 (120 reviews)</span>
        </div>
        <button
          onClick={onAddToCart}
          className="w-full bg-orange-500 text-white font-semibold py-2 rounded-md hover:bg-orange-600 transition-colors duration-300 flex items-center justify-center space-x-2"
        >
          <ShoppingCart size={16} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

const Loader = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  return (
    <div className={`loader-spinner border-4 border-t-4 rounded-full animate-spin border-orange-500 border-t-transparent ${sizes[size]}`}></div>
  );
};

// Mock hero banner images.
const heroBanners = [
  {
    title: 'Shop the Best Deals on Breakfast Factory',
    subtitle: 'Discover amazing products at unbeatable prices. Free delivery on orders over ₦100.',
    image: "https://placehold.co/1200x500/FDBA74/991B1B?text=Breakfast+Factory+Banner+1",
    cta: '/products',
    ctaText: 'Shop Now',
  },
  {
    title: 'Exclusive Electronics Sale',
    subtitle: 'Up to 50% off on smartphones, laptops, and more!',
    image: "https://placehold.co/1200x500/FBBF24/9A3412?text=Electronics+Sale",
    cta: '/products?category=electronics',
    ctaText: 'Explore Deals',
  },
  {
    title: 'New Fashion Arrivals',
    subtitle: 'Check out our latest collection of trendy outfits.',
    image:  "https://placehold.co/1200x500/A78BFA/6B21A8?text=New+Fashion",
    cta: '/products?category=fashion',
    ctaText: 'Shop Fashion',
  },
];

// Mock brand images.
const brandImages = [
  "https://placehold.co/150x80/E2E8F0/64748B?text=Brand+A",
  "https://placehold.co/150x80/CBD5E1/475569?text=Brand+B",
  "https://placehold.co/150x80/F0F4F8/6B7280?text=Brand+C",
  "https://placehold.co/150x80/E5E7EB/6B7280?text=Brand+D",
  "https://placehold.co/150x80/F3F4F6/6B7280?text=Brand+E",
  "https://placehold.co/150x80/FEE2E2/EF4444?text=Brand+F",
];

// Mock data for products since the user's API endpoints are external and may not work.
const mockProducts = [
  { _id: '1', productName: 'Premium Headphones', productPrice: 15000, discountPrice: 12000, images: ["https://placehold.co/400x400/BDBDBD/4A4A4A?text=Headphones"] },
  { _id: '2', productName: 'Smart Watch Series 7', productPrice: 80000, discountPrice: 75000, images: ["https://placehold.co/400x400/9E9E9E/4A4A4A?text=Smart+Watch"] },
  { _id: '3', productName: 'Organic Coffee Beans', productPrice: 5000, discountPrice: null, images: ["https://placehold.co/400x400/BCAAA4/4A4A4A?text=Coffee"] },
  { _id: '4', productName: 'Running Shoes', productPrice: 25000, discountPrice: 20000, images: ["https://placehold.co/400x400/A1887F/4A4A4A?text=Shoes"] },
  { _id: '5', productName: 'Ergonomic Office Chair', productPrice: 45000, discountPrice: null, images: ["https://placehold.co/400x400/8D6E63/4A4A4A?text=Chair"] },
  { _id: '6', productName: '4K Ultra HD TV', productPrice: 250000, discountPrice: 220000, images: ["https://placehold.co/400x400/795548/4A4A4A?text=4K+TV"] },
  { _id: '7', productName: 'Leather Wallet', productPrice: 8000, discountPrice: null, images: ["https://placehold.co/400x400/6D4C41/4A4A4A?text=Wallet"] },
  { _id: '8', productName: 'Stainless Steel Water Bottle', productPrice: 3000, discountPrice: 2500, images: ["https://placehold.co/400x400/5D4037/4A4A4A?text=Bottle"] },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState({ featured: true, bestSellers: true, flash: true });
  const [error, setError] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]); // Local cart state

  // Fetch mock data to simulate API calls
  useEffect(() => {
    // Simulate fetching featured products
    setLoading(prev => ({ ...prev, featured: true }));
    setTimeout(() => {
      setFeaturedProducts(mockProducts.filter(p => p.productPrice > 10000).slice(0, 8));
      setLoading(prev => ({ ...prev, featured: false }));
    }, 500);

    // Simulate fetching best sellers
    setLoading(prev => ({ ...prev, bestSellers: true }));
    setTimeout(() => {
      setBestSellers(mockProducts.filter(p => p.productPrice < 50000).slice(0, 8));
      setLoading(prev => ({ ...prev, bestSellers: false }));
    }, 500);

    // Simulate fetching flash sales
    setLoading(prev => ({ ...prev, flash: true }));
    setTimeout(() => {
      setFlashSales(mockProducts.filter(p => p.discountPrice).slice(0, 6));
      setLoading(prev => ({ ...prev, flash: false }));
    }, 500);
  }, []);


  // Auto-rotate hero banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Add to cart function using local state
  const handleAddToCart = (product) => {
    try {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item._id === product._id);
        if (existingItem) {
          return prevCart.map(item =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevCart, { ...product, quantity: 1 }];
        }
      });
      toast.success(`${product.productName} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err.message);
      toast.error('Failed to add product to cart');
    }
  };

  // Hero banner section with carousel
  const HeroBanner = () => (
    <div className="relative bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="relative rounded-xl overflow-hidden shadow-2xl">
          <img
            src={heroBanners[currentBanner].image}
            alt={heroBanners[currentBanner].title}
            className="w-full h-[250px] md:h-[400px] lg:h-[500px] object-cover transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 md:p-8 text-center">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-white drop-shadow-lg">
                {heroBanners[currentBanner].title}
              </h1>
              <p className="text-sm md:text-lg mb-6 opacity-90 text-gray-200">
                {heroBanners[currentBanner].subtitle}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to={heroBanners[currentBanner].cta}
                  className="bg-orange-500 text-white px-6 py-3 rounded-md font-medium hover:bg-orange-600 transition-colors shadow-lg"
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
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {heroBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  currentBanner === index ? 'bg-white scale-125' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Flash Sales section with countdown timer
  const FlashSalesSection = () => {
    const [timeLeft, setTimeLeft] = useState(3600 * 24); // 24 hours in seconds

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mr-4">Flash Sales</h2>
              <div className="flex items-center bg-red-500 text-white px-3 py-1 rounded-full shadow-lg">
                <Clock className="h-4 w-4 mr-2" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Link to="/products?flash=true" className="text-orange-600 flex items-center hover:underline">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {loading.flash ? (
            <div className="flex justify-center py-12">
              <Loader size="md" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : flashSales.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {flashSales.map((product) => (
                <div key={product._id} className="relative group">
                  {product.discountPrice && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                      -{Math.round(((product.productPrice - product.discountPrice) / product.productPrice) * 100)}%
                    </div>
                  )}
                  <ProductCard
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              No flash sales available.
            </div>
          )}
        </div>
      </section>
    );
  };

  // Featured products section
  const FeaturedProductsSection = () => (
    <section className="py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Featured Products</h2>
          <Link to="/products" className="text-orange-600 flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        {loading.featured ? (
          <div className="flex justify-center py-12">
            <Loader size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No featured products available.
          </div>
        )}
      </div>
    </section>
  );

  // Best sellers section
  const BestSellersSection = () => (
    <section className="py-8 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Best Sellers</h2>
          <Link to="/products" className="text-orange-600 flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        {loading.bestSellers ? (
          <div className="flex justify-center py-12">
            <Loader size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
            {bestSellers.slice(0, 8).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No best sellers available.
          </div>
        )}
      </div>
    </section>
  );

  // Top Brands section
  const TopBrandsSection = () => (
    <section className="py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Top Brands</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {brandImages.map((brand, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow">
              <img src={brand} alt={`Brand ${index + 1}`} className="w-full h-16 object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Newsletter Signup
  const NewsletterSection = () => (
    <section className="py-12 bg-orange-600 text-white dark:bg-orange-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-lg mb-6 opacity-90">Get the latest deals and updates straight to your inbox</p>
        <div className="max-w-md mx-auto flex rounded-md overflow-hidden shadow-lg">
          <input
            type="email"
            placeholder="Enter your email address"
            className="flex-grow px-4 py-3 text-gray-800 focus:outline-none"
          />
          <button className="bg-orange-800 hover:bg-orange-900 px-6 py-3 font-medium transition-colors">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );

  // Features section
  const FeaturesSection = () => (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureItem
            icon={<Truck className="h-8 w-8 text-orange-600" />}
            title="Free Delivery"
            description="On all orders above ₦100"
          />
          <FeatureItem
            icon={<CreditCard className="h-8 w-8 text-orange-600" />}
            title="Secure Payments"
            description="100% secure processing"
          />
          <FeatureItem
            icon={<ShieldCheck className="h-8 w-8 text-orange-600" />}
            title="Easy Returns"
            description="30-day return policy"
          />
        </div>
      </div>
    </section>
  );

  const FeatureItem = ({ icon, title, description }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      <HeroBanner />
      <FlashSalesSection />
      <FeaturedProductsSection />
      <BestSellersSection />
      <TopBrandsSection />
      <NewsletterSection />
      <FeaturesSection />
    </div>
  );
};

export default HomePage;

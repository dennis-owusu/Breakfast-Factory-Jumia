import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById, addProductReview, clearProduct } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { Star, Truck, ShieldCheck, RotateCcw, ChevronRight, Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import Loader from '../components/ui/Loader';
import ProductCard from '../components/ProductCard';
import { formatPrice, formatDate } from '../utils/helpers';

const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { product, featuredProducts, isLoading, error } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Fetch product details when component mounts or ID changes
  useEffect(() => {
    dispatch(fetchProductById(id));
    
    // Cleanup function to clear product when component unmounts
    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, id]);
  
  // Handle quantity change
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    if (quantity < (product?.stock || 10)) {
      setQuantity(quantity + 1);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    setAddingToCart(true);
    dispatch(addToCart({ productId: id, quantity }))
      .unwrap()
      .then(() => {
        setAddingToCart(false);
      })
      .catch(() => {
        setAddingToCart(false);
      });
  };
  
  // Handle review submission
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }
    
    setReviewSubmitting(true);
    dispatch(addProductReview({ productId: id, rating: reviewRating, comment: reviewComment }))
      .unwrap()
      .then(() => {
        setReviewComment('');
        setReviewSubmitting(false);
      })
      .catch(() => {
        setReviewSubmitting(false);
      });
  };
  
  // Calculate average rating
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  
  // Check if user has already reviewed this product
  const hasUserReviewed = () => {
    if (!isAuthenticated || !product || !product.reviews) return false;
    return product.reviews.some(review => review.user._id === user._id);
  };
  
  if (isLoading && !product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <Link to="/products" className="text-orange-500 hover:text-orange-600 flex items-center">
          <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Back to Products
        </Link>
      </div>
    );
  }
  
  if (!product) {
    return null;
  }
  
  const { 
    name, 
    description, 
    price, 
    discountPrice, 
    images = [], 
    stock, 
    outlet, 
    reviews = [],
    category,
    specifications = {}
  } = product;
  
  const averageRating = calculateAverageRating(reviews);
  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm">
          <Link to="/" className="text-gray-500 hover:text-orange-500">Home</Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link to="/products" className="text-gray-500 hover:text-orange-500">Products</Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">{name}</span>
        </nav>
        
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Product Images */}
          <div>
            <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img 
                src={images[selectedImage] || 'https://via.placeholder.com/600'} 
                alt={name} 
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-md ${selectedImage === index ? 'ring-2 ring-orange-500' : 'ring-1 ring-gray-200'}`}
                >
                  <img 
                    src={image} 
                    alt={`${name} - Image ${index + 1}`} 
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Product Info */}
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{name}</h1>
              <div className="mt-2">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="ml-2 text-sm text-gray-500">{averageRating} out of 5 stars ({reviews.length} reviews)</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">Sold by <Link to={`/outlet/${outlet?._id}`} className="text-orange-500 hover:text-orange-600">{outlet?.name}</Link></p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center">
                {discountPrice ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900">{formatPrice(discountPrice)}</p>
                    <p className="ml-3 text-lg text-gray-500 line-through">{formatPrice(price)}</p>
                    <p className="ml-3 text-sm font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">{discount}% OFF</p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{formatPrice(price)}</p>
                )}
              </div>
              
              <p className="mt-2 text-sm text-gray-500">
                {stock > 0 ? (
                  <span className="text-green-600 font-medium">In Stock ({stock} available)</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </p>
            </div>
            
            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-900">Description</h2>
              <div className="mt-2 space-y-4 text-gray-700">
                <p>{description}</p>
              </div>
            </div>
            
            {/* Quantity selector */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-900 mb-2">Quantity</h2>
              <div className="flex items-center">
                <button 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="p-2 border border-gray-300 rounded-l-md disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input 
                  type="number" 
                  min="1" 
                  max={stock || 10}
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="p-2 w-16 text-center border-t border-b border-gray-300 focus:outline-none"
                />
                <button 
                  onClick={increaseQuantity}
                  disabled={quantity >= (stock || 10)}
                  className="p-2 border border-gray-300 rounded-r-md disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Add to cart and wishlist buttons */}
            <div className="flex space-x-4 mb-8">
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart || stock <= 0}
                className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
              >
                {addingToCart ? (
                  <Loader size="sm" color="white" />
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </button>
              <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                <Heart className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Product features */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Truck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Free Delivery</h3>
                    <p className="mt-1 text-sm text-gray-500">On orders over ₵100</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Warranty</h3>
                    <p className="mt-1 text-sm text-gray-500">1 year warranty</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <RotateCcw className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Easy Returns</h3>
                    <p className="mt-1 text-sm text-gray-500">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product specifications */}
        {Object.keys(specifications).length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Specifications</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(specifications).map(([key, value]) => (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50 w-1/4">{key}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Reviews section */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Reviews</h2>
          
          {/* Review summary */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="text-5xl font-bold text-gray-900">{averageRating}</p>
                  <div className="ml-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{reviews.length} reviews</p>
                  </div>
                </div>
              </div>
              
              {/* Add review form */}
              {isAuthenticated && !hasUserReviewed() && (
                <div className="mt-6 md:mt-0 md:ml-6 md:w-1/2">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Add a Review</h3>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-2">
                      <label className="block text-sm text-gray-700 mb-1">Rating</label>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="p-1"
                          >
                            <Star 
                              className={`h-6 w-6 ${rating <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <label htmlFor="comment" className="block text-sm text-gray-700 mb-1">Comment</label>
                      <textarea
                        id="comment"
                        rows="3"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product"
                        className="w-full border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="w-full bg-orange-500 text-white py-2 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}
              
              {isAuthenticated && hasUserReviewed() && (
                <div className="mt-6 md:mt-0 md:ml-6 md:w-1/2">
                  <p className="text-sm text-gray-700">You have already reviewed this product.</p>
                </div>
              )}
              
              {!isAuthenticated && (
                <div className="mt-6 md:mt-0 md:ml-6 md:w-1/2">
                  <p className="text-sm text-gray-700 mb-2">Please sign in to leave a review.</p>
                  <Link 
                    to="/login" 
                    className="inline-block bg-orange-500 text-white py-2 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Review list */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="ml-2 text-sm font-medium text-gray-900">{review.user.name}</p>
                    <p className="ml-2 text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          )}
        </div>
        
        {/* Related products */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
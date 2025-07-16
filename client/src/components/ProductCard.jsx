import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { addToCart } from '../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    const productToAdd = {
      _id: product._id,
      productName: product.productName,
      productPrice: Number(product.productPrice),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      images: Array.isArray(product.images) && product.images.length > 0 
        ? product.images 
        : ['https://via.placeholder.com/150?text=No+Image'],
      rating: product.rating || 0,
      numReviews: product.numReviews || 0,
      outlet: product.outlet || { name: 'Store Name' },
    };
    console.log('Adding to cart:', productToAdd); // Debug log
    dispatch(addToCart(productToAdd));
    setIsAdded(true);
    toast.success(`${product.productName} added to cart!`);

    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const {
    _id = '1',
    productName = 'Product Name',
    productPrice = 0,
    discountPrice,
    images = ['https://via.placeholder.com/150?text=No+Image'],
    rating = 0,
    numReviews = 0,
    outlet = { name: 'Store Name' },
  } = product || {};

  // Debug log for images
  console.log(`Product ${productName} images:`, images);

  const discount = discountPrice ? Math.round(((productPrice - discountPrice) / productPrice) * 100) : 0;

  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 w-full max-w-[200px] mx-auto">
      <div className="relative h-40 overflow-hidden bg-white">
        <Link to={`/product/${_id}`}>
          <img
            src={Array.isArray(images) && images.length > 0 ? images[0] : 'https://via.placeholder.com/150?text=No+Image'}
            alt={productName}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.error(`Image failed to load for ${productName}:`, images[0]);
              e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
            }}
          />
        </Link>
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}
        <button
          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-sm hover:bg-gray-100 transition-colors duration-200"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4 text-gray-500 hover:text-red-500" />
        </button>
      </div>

      <div className="p-3">
        <Link to={`/product/${_id}`} className="block">
          <h3 className="text-xs text-gray-500 mb-1">{outlet.name}</h3>
          <h2 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 h-10">{productName}</h2>
        </Link>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">({numReviews})</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {discountPrice ? (
              <div className="flex items-center">
                <span className="text-sm font-bold text-orange-600 mr-2">₦{discountPrice.toLocaleString()}</span>
                <span className="text-xs text-gray-500 line-through">₦{productPrice.toLocaleString()}</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-orange-600">₦{productPrice.toLocaleString()}</span>
            )}
          </div>
          <AnimatePresence>
            <motion.div
              initial={{ scale: 1 }}
              animate={isAdded ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={handleAddToCart}
                className={`${isAdded ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white p-2 rounded-full h-8 w-8 flex items-center justify-center transition-colors duration-300`}
                aria-label="Add to cart"
                disabled={isAdded}
              >
                {isAdded ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
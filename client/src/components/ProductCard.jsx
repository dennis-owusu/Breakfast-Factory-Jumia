import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { addToCart } from '../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(product));
    toast.success(`${product.productName} added to cart!`);
  };

  // Default values in case product props are missing
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

  const discount = discountPrice ? Math.round(((productPrice - discountPrice) / productPrice) * 100) : 0;

  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 w-full max-w-[200px] mx-auto">
      {/* Product Image with discount badge */}
      <div className="relative h-40 overflow-hidden bg-white">
        <Link to={`/product/${_id}`}>
          <img
            src={images[0]}
            alt={productName}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
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

      {/* Product Info */}
      <div className="p-3">
        <Link to={`/product/${_id}`} className="block">
          <h3 className="text-xs text-gray-500 mb-1">{outlet.name}</h3>
          <h2 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 h-10">{productName}</h2>
        </Link>

        {/* Rating */}
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

        {/* Price */}
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
          <Button
            onClick={handleAddToCart}
            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full h-8 w-8 flex items-center justify-center"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
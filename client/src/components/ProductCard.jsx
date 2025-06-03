import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';

const ProductCard = ({ product }) => {
  // Default values in case product props are missing
  const {
    _id = '1',
    name = 'Product Name',
    price = 0,
    discountPrice,
    images = ['https://via.placeholder.com/300'],
    rating = 0,
    numReviews = 0,
    outlet = { name: 'Store Name' }
  } = product || {};

  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;

  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image with discount badge */}
      <div className="relative h-48 overflow-hidden">
        <Link to={`/product/${_id}`}>
          <img 
            src={images[0]} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}
        <button 
          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4 text-gray-500 hover:text-red-500" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link to={`/product/${_id}`} className="block">
          <h3 className="text-sm text-gray-500 mb-1">{outlet.name}</h3>
          <h2 className="font-medium text-gray-900 mb-2 line-clamp-2 h-12">{name}</h2>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
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
                <span className="font-bold text-gray-900 mr-2">₵{discountPrice.toFixed(2)}</span>
                <span className="text-sm text-gray-500 line-through">₵{price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="font-bold text-gray-900">₵{price.toFixed(2)}</span>
            )}
          </div>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-md transition-colors duration-200"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
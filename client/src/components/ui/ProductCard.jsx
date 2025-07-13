import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardTitle, CardDescription } from './card';
import { Button } from './button';

const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const { _id, name, image, price, rating, numReviews, countInStock } = product;

  const handleAddToCart = (e) => {
    e.preventDefault();
    onAddToCart(product);
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    onAddToWishlist(product);
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <Link to={`/product/${_id}`} className="block">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img 
            src={image} 
            alt={name} 
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105" 
          />
          {countInStock === 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <CardTitle className="text-lg font-semibold line-clamp-1 mb-1">{name}</CardTitle>
          <CardDescription className="text-sm text-gray-500 line-clamp-2 mb-2">
            {product.description}
          </CardDescription>
          
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">({numReviews})</span>
          </div>
          
          <div className="text-lg font-bold text-orange-600">
            ${price.toFixed(2)}
          </div>
        </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          disabled={countInStock === 0}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          Add to Cart
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          className="h-9 w-9"
          onClick={handleAddToWishlist}
        >
          <Heart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
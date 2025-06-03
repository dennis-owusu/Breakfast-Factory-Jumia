import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  // Default values in case category props are missing
  const {
    _id = '1',
    name = 'Category Name',
    image = 'https://via.placeholder.com/300',
    productCount = 0
  } = category || {};

  return (
    <Link 
      to={`/products?category=${_id}`}
      className="group block relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <div className="aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <h3 className="text-white font-medium text-lg">{name}</h3>
          <p className="text-gray-200 text-sm">{productCount} Products</p>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
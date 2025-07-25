import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  // Default values in case category props are missing
  const {
    _id = '1',
    name = 'Category Name',
    productCount = 0
  } = category || {};

  return (
    <Link 
      to={`/products?category=${_id}`}
      className="group block relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <div className="bg-orange-100 aspect-square overflow-hidden flex items-center justify-center">
        <div className="p-4 text-center">
          <h3 className="text-gray-800 font-medium text-lg">{name}</h3>
          <p className="text-gray-600 text-sm">{productCount} Products</p>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Trash2, Star, ShoppingCart, Tag, Package, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-hot-toast';

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/product/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response: Expected JSON, received HTML or other content');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load product');
        }
        
        setProduct(data.product);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err.message);
        setError('Failed to load product. Please try again.');
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleEdit = () => {
    navigate(`/outlet/product/${id}/edit`);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/products/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response: Expected JSON, received HTML or other content');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete product');
      }
      
      toast.success('Product deleted successfully');
      navigate('/outlet/products');
    } catch (err) {
      console.error('Error deleting product:', err.message);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate('/outlet/products')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Product not found</p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate('/outlet/products')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button and actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Button 
              onClick={() => navigate('/outlet/products')} 
              variant="ghost" 
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Product Details
            </h1>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={handleEdit} 
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
            <Button 
              onClick={handleDeleteClick} 
              variant="outline" 
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Product details card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Product image */}
            <div className="md:col-span-1">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {product.productImage ? (
                  <img 
                    src={product.productImage} 
                    alt={product.productName} 
                    className="w-full h-full object-cover"
                    onError={() => console.error('Failed to load image:', product.productImage)}
                  />
                ) : (
                  <Package className="h-24 w-24 text-gray-400" />
                )}
              </div>
            </div>

            {/* Product info */}
            <div className="md:col-span-2 flex flex-col">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.productName}</h2>
                  <div className="flex items-center mb-4">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 mr-2">
                      {product.category}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      ID: {product.productId || product._id}
                    </span>
                  </div>
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ₦{product.productPrice.toFixed(2)}
                  </div>
                  {product.discountPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      ₦{product.discountPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">
                  {product.description || 'No description available.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Stock Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Available Stock:</span>
                      <span className={`font-medium ${product.numberOfProductsAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.numberOfProductsAvailable} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge className={product.numberOfProductsAvailable > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {product.numberOfProductsAvailable > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Product Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                      <dl className="divide-y divide-gray-200">
                        {product.specifications.map((spec, index) => (
                          <div key={index} className="flex justify-between py-2">
                            <dt className="text-sm text-gray-500">{spec.key}</dt>
                            <dd className="text-sm font-medium text-gray-900">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-gray-500">No specifications available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-medium">{product.productName}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button 
                  onClick={cancelDelete} 
                  variant="outline" 
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmDelete} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductView;
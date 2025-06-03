import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCart, updateCartItem, removeCartItem, clearCart } from '../redux/slices/cartSlice';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react';
import Loader from '../components/ui/Loader';
import { formatPrice } from '../utils/helpers';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, subtotal, totalItems, isLoading, error } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [processingItem, setProcessingItem] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  
  const handleQuantityChange = (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    if (newQuantity > 10) return;
    
    setProcessingItem(itemId);
    dispatch(updateCartItem({ itemId, quantity: newQuantity }))
      .unwrap()
      .finally(() => {
        setProcessingItem(null);
      });
  };
  
  const handleRemoveItem = (itemId) => {
    setProcessingItem(itemId);
    dispatch(removeCartItem(itemId))
      .unwrap()
      .finally(() => {
        setProcessingItem(null);
      });
  };
  
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }
    
    setCheckoutLoading(true);
    // In a real app, you would navigate to checkout page or process payment
    setTimeout(() => {
      setCheckoutLoading(false);
      navigate('/checkout');
    }, 1000);
  };
  
  if (isLoading && cartItems.length === 0) {
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
        <Link to="/" className="text-orange-500 hover:text-orange-600 flex items-center">
          <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Continue Shopping
        </Link>
      </div>
    );
  }
  
  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any products to your cart yet.</p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            {/* Cart items */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            <img 
                              src={item.product.images[0] || 'https://via.placeholder.com/150'} 
                              alt={item.product.name}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="ml-4">
                            <Link to={`/product/${item.product._id}`} className="text-sm font-medium text-gray-900 hover:text-orange-500">
                              {item.product.name}
                            </Link>
                            {item.product.outlet && (
                              <p className="text-xs text-gray-500 mt-1">Sold by: {item.product.outlet.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.product.discountPrice ? (
                            <>
                              <span className="font-medium">{formatPrice(item.product.discountPrice)}</span>
                              <span className="ml-2 text-xs text-gray-500 line-through">{formatPrice(item.product.price)}</span>
                            </>
                          ) : (
                            <span className="font-medium">{formatPrice(item.product.price)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleQuantityChange(item._id, item.quantity, -1)}
                            disabled={processingItem === item._id || item.quantity <= 1}
                            className="p-1 border border-gray-300 rounded-l-md disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-1 border-t border-b border-gray-300">
                            {processingItem === item._id ? (
                              <Loader size="xs" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button 
                            onClick={() => handleQuantityChange(item._id, item.quantity, 1)}
                            disabled={processingItem === item._id || item.quantity >= 10}
                            className="p-1 border border-gray-300 rounded-r-md disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(
                          (item.product.discountPrice || item.product.price) * item.quantity
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleRemoveItem(item._id)}
                          disabled={processingItem === item._id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center">
              <Link to="/products" className="text-orange-500 hover:text-orange-600 flex items-center">
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Continue Shopping
              </Link>
              <button 
                onClick={handleClearCart}
                className="text-red-500 hover:text-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear Cart
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal ({totalItems} items)</p>
                  <p className="font-medium text-gray-900">{formatPrice(subtotal)}</p>
                </div>
                
                <div className="flex justify-between">
                  <p className="text-gray-600">Shipping</p>
                  <p className="font-medium text-gray-900">Free</p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <p className="text-lg font-medium text-gray-900">Total</p>
                    <p className="text-lg font-medium text-gray-900">{formatPrice(subtotal)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Including VAT</p>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full mt-6 bg-orange-500 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
              >
                {checkoutLoading ? (
                  <Loader size="sm" color="white" />
                ) : (
                  <>
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
              
              <div className="mt-4">
                <p className="text-xs text-gray-500">By proceeding to checkout, you agree to our <Link to="/terms" className="text-orange-500 hover:text-orange-600">Terms of Service</Link> and <Link to="/privacy" className="text-orange-500 hover:text-orange-600">Privacy Policy</Link>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
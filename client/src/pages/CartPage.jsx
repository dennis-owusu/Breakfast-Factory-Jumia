import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react';
import Loader from '../components/ui/Loader';
import { formatPrice } from '../utils/helpers';
import { incrementQuantity, decrementQuantity, removeItem, clearCart } from '../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/button';

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, totalPrice } = useSelector((state) => state.cart);
  const [processingItem, setProcessingItem] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleIncrementQuantity = (itemId) => {
    setProcessingItem(itemId);
    dispatch(incrementQuantity(itemId));
    toast.success('Quantity updated');
    setTimeout(() => setProcessingItem(null), 500);
  };

  const handleDecrementQuantity = (itemId) => {
    setProcessingItem(itemId);
    dispatch(decrementQuantity(itemId));
    toast.success('Quantity updated');
    setTimeout(() => setProcessingItem(null), 500);
  };

  const handleRemoveItem = (itemId) => {
    setProcessingItem(itemId);
    dispatch(removeItem(itemId));
    toast.success('Item removed from cart');
    setTimeout(() => setProcessingItem(null), 500);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      toast.success('Cart cleared');
    }
  };

  const handleCheckout = () => {
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      navigate('/checkout');
    }, 1000);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cart ({cart.length})</h1>

        <div className="flex flex-col lg:flex-row lg:gap-6">
          <div className="lg:w-3/4 mb-6 lg:mb-0">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="relative px-4 py-3">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <Link to={`/product/${item.product._id}`} className="flex-shrink-0">
                            <img
                              src={Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : 'https://via.placeholder.com/150'}
                              alt={(item.product.productName || item.product.name) || 'Product'}
                              className="h-16 w-16 object-contain rounded-md"
                            />
                          </Link>
                          <div className="ml-4">
                            <Link to={`/product/${item.product._id}`} className="text-sm font-medium text-gray-900 hover:text-orange-500">
                              {(item.product.productName || item.product.name) || 'Unnamed Product'}
                            </Link>
                            {item.product.outlet ? (
                              <p className="text-xs text-gray-500 mt-1">Sold by: {item.product.outlet.name}</p>
                            ) : item.product.seller ? (
                              <p className="text-xs text-gray-500 mt-1">Sold by: {item.product.seller}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {item.product.discountPrice ? (
                            <>
                              <span className="font-bold text-orange-600 mr-2">
                                {formatPrice(item.product.discountPrice)}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                {formatPrice(item.product.productPrice || item.product.price || 0)}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-orange-600">
                              {formatPrice(item.product.productPrice || item.product.price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleDecrementQuantity(item._id)}
                            disabled={processingItem === item._id || item.quantity <= 1}
                            className="p-1 border border-gray-300 rounded-l-md disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1 border-t border-b border-gray-300 text-sm">
                            {processingItem === item._id ? <Loader size="xs" /> : item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrementQuantity(item._id)}
                            disabled={processingItem === item._id || item.quantity >= 10}
                            className="p-1 border border-gray-300 rounded-r-md disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-orange-600">
                        {formatPrice((item.product.discountPrice || item.product.productPrice || item.product.price) * item.quantity)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          disabled={processingItem === item._id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <Link to="/products" className="text-orange-500 hover:text-orange-600 flex items-center text-sm">
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Continue Shopping
              </Link>
              <button
                onClick={handleClearCart}
                className="text-red-500 hover:text-red-700 flex items-center text-sm"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear Cart
              </button>
            </div>
          </div>

          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-600">Subtotal ({cart.length} items)</p>
                  <p className="font-medium text-gray-900">{formatPrice(totalPrice)}</p>
                </div>

                <div className="flex justify-between text-sm">
                  <p className="text-gray-600">Shipping</p>
                  <p className="font-medium text-gray-900">Free</p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <p className="font-bold text-gray-900">Total</p>
                    <p className="font-bold text-amber-800">{formatPrice(totalPrice)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Including VAT</p>
                </div>
              </div>

              <Button 
                onClick={handleCheckout} 
                disabled={checkoutLoading || cart.length === 0}
                className="w-full bg-amber-800 hover:bg-amber-900 text-white font-medium py-3 rounded-md transition-colors duration-300 flex items-center justify-center"
              >
                {checkoutLoading ? <Loader size="sm" className="mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Proceed to Checkout
              </Button>

              <div className="mt-3 text-xs text-gray-500">
                <p>
                  By proceeding to checkout, you agree to our{' '}
                  <Link to="/terms" className="text-orange-500 hover:text-orange-600">Terms of Service</Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-orange-500 hover:text-orange-600">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
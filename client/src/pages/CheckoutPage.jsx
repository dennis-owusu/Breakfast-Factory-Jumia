import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import Loader from '../components/ui/Loader';
import { formatPrice } from '../utils/helpers';
import { userAPI } from '../utils/api';
import { clearCart } from '../redux/slices/cartSlice';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, subtotal, totalItems } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'cash_on_delivery'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }
    
    // Redirect if cart is empty
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, cartItems, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Prepare order data
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.discountPrice || item.product.price
        })),
        shipping: {
          fullName: formData.fullName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          phone: formData.phone
        },
        payment: {
          method: formData.paymentMethod
        },
        itemsPrice: subtotal,
        shippingPrice: 0, // Free shipping for now
        totalPrice: subtotal
      };
      
      // Create order
      const response = await userAPI.createOrder(orderData);
      
      // If payment method is Paystack, redirect to Paystack payment page
      if (formData.paymentMethod === 'paystack' && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
        return;
      }
      
      // For cash on delivery, show success and clear cart
      setSuccess(true);
      dispatch(clearCart());
      
      // Redirect to order confirmation after 2 seconds
      setTimeout(() => {
        navigate(`/user/orders/${response.data.order._id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !success) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <h2 className="text-xl font-semibold text-green-800">Order Placed Successfully!</h2>
              <p className="text-green-700 mt-1">Your order has been placed and will be processed soon.</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Link 
              to="/user/orders" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/cart" className="text-orange-500 hover:text-orange-600 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2" /> Shipping Information
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      Postal Code
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" /> Payment Method
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="cash_on_delivery"
                        name="paymentMethod"
                        type="radio"
                        value="cash_on_delivery"
                        checked={formData.paymentMethod === 'cash_on_delivery'}
                        onChange={handleChange}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                      <label htmlFor="cash_on_delivery" className="ml-3 block text-sm font-medium text-gray-700">
                        Cash on Delivery
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="paystack"
                        name="paymentMethod"
                        type="radio"
                        value="paystack"
                        checked={formData.paymentMethod === 'paystack'}
                        onChange={handleChange}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                      <label htmlFor="paystack" className="ml-3 block text-sm font-medium text-gray-700">
                        Pay with Paystack
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 lg:hidden">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Loader size="sm" color="white" /> : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <div className="max-h-80 overflow-y-auto mb-6">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex py-4 border-b border-gray-200 last:border-0">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img 
                        src={item.product.images[0] || 'https://via.placeholder.com/150'} 
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-900">
                          <h3>{item.product.name}</h3>
                          <p className="ml-4">
                            {formatPrice(
                              (item.product.discountPrice || item.product.price) * item.quantity
                            )}
                          </p>
                        </div>
                        {item.product.outlet && (
                          <p className="text-xs text-gray-500 mt-1">Sold by: {item.product.outlet.name}</p>
                        )}
                      </div>
                      <div className="flex flex-1 items-end justify-between text-xs">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
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
              
              <div className="mt-6 hidden lg:block">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader size="sm" color="white" /> : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
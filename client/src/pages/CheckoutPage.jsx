import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import Loader from '../components/ui/Loader';
import { formatPrice } from '../utils/helpers';
import { clearCart } from '../redux/slices/cartSlice';
import { Input } from '../components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useRef } from 'react';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart: cartItems, totalPrice: subtotal } = useSelector((state) => state.cart);
  const { currentUser } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'cash_on_delivery',
    orderNumber: uuidv4(),
  });

  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [triggerPayment, setTriggerPayment] = useState(false);
  const orderIdRef = useRef(null);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const initializePayment = usePaystackPayment({
    reference: formData.orderNumber,
    email: currentUser?.email || '',
    amount: subtotal * 100,
    publicKey,
    currency: 'GHS',
  });

  const triggerPaystackPayment = () => {
    initializePayment({
      onSuccess: handlePaystackSuccess,
      onClose: handlePaystackClose,
    });
  };

  if (!currentUser) {
    navigate('/login');
     <div>Redirecting to login...</div>;
  }

  if (cartItems.length === 0) {
    navigate('/cart');
     <div>Redirecting to cart...</div>;
  }

  useEffect(() => {
    // Redirect if not authenticated
    if (!currentUser) {
      navigate('/login?redirect=checkout');
      return;
    }

    // Redirect if cart is empty
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Debug cart items
    console.log('Cart items in Checkout:', cartItems);
  }, [currentUser, cartItems, navigate]);

  useEffect(() => {
    if (triggerPayment) {
      triggerPaystackPayment();
      setTriggerPayment(false);
    }
  }, [triggerPayment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };




  const handlePaystackSuccess = async (reference) => {
    try {
      const response = await fetch('http://localhost:3000/api/route/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: reference.reference,
          userId: currentUser._id,
          amount: subtotal,
          phoneNumber: formData.phone,
          currency: 'GHS',
          orderId: orderIdRef.current,
          payerEmail: currentUser?.email,
          paymentMethod: formData.paymentMethod,
          status: 'paid',
        }),
      });
      if (response.ok) {
        setSuccess(true);
        dispatch(clearCart());
        setTimeout(() => navigate(`/user/orders/${orderId}`), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save transaction.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save transaction.');
    }
  };

const handlePaystackClose = async () => {
  try {
    await fetch('http://localhost:3000/api/route/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceId: formData.orderNumber,
        userId: currentUser._id,
        orderId: orderIdRef.current,
        amount: subtotal,
        paymentMethod: formData.paymentMethod,
        currency: 'GHS',
        payerEmail: currentUser?.email,
        phoneNumber: formData.phone,
        status: 'failed',
      }),
    });
  } catch (err) {
    console.error('Failed to log failed transaction:', err);
  }
  setError('Payment popup closed.');
  // Navigate to products page after payment is cancelled/failed
  navigate('/products');
};

  const handleSubmit = async (e, isCash = false) => {
    e.preventDefault();
    setError(null);
    if (!formData.phone.match(/^[+]?[0-9]{10,15}$/)) {
      setLoading(false);
      setError('Invalid phone number format.');
      return;
    }

    try {
      // Prepare order data
      const orderData = {
        user: currentUser._id,
        products: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        totalPrice: subtotal,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        phoneNumber: formData.phone,
        orderNumber: formData.orderNumber,
        postalCode: formData.postalCode,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
      };

      // Create order
      const response = await fetch('http://localhost:3000/api/route/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      setOrderId(result._id);
      orderIdRef.current = result._id;

      if (formData.paymentMethod === 'cash_on_delivery' || isCash) {
        setSuccess(true);
        dispatch(clearCart());
        setTimeout(() => {
          navigate(`/user/orders/${result._id}`);
        }, 2000);
      } else {
        setLoading(false);
        setTriggerPayment(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  const handleCashPaymentTrigger = async () => {
    setLoading(true);
    await handleSubmit({ preventDefault: () => {} }, true);
  };
  const handlePaystackPayment = async () => {
    setLoading(true);
    await handleSubmit({ preventDefault: () => {} }, false);
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
          // Update back button to amber
          <Link
            to="/cart"
            className="inline-flex items-center text-amber-800 hover:text-amber-900 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
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

              <form id="checkout-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <Input
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
                      <Input
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
                      <Input
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
                      <Input
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
                      <Input
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
                      <Input
                        type="tel"
                        id="phone"
                        placeholder="e.g. +233123456789"
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

                  <RadioGroup
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
                    className="space-y-4"
                  >
                    <div className="flex items-center">
                      <RadioGroupItem
                        value="cash_on_delivery"
                        id="cash_on_delivery"
                        className="focus:ring-orange-500 text-orange-600"
                      />
                      <label
                        htmlFor="cash_on_delivery"
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        Cash on Delivery
                      </label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem
                        value="paystack"
                        id="paystack"
                        className="focus:ring-orange-500 text-orange-600"
                      />
                      <label
                        htmlFor="paystack"
                        className="ml-3 block text-sm font-medium text-gray-700"
                      >
                        Pay with Paystack
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="mt-8 lg:hidden">
                  {formData.paymentMethod === 'cash_on_delivery' ? (
                    <Button
                      onClick={handleCashPaymentTrigger}
                      disabled={loading}
                      className="w-full bg-orange-500 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? <Loader size="sm" color="white" /> : 'Place Order'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePaystackPayment}
                      disabled={loading || formData.paymentMethod !== 'paystack'}
                      className="w-full bg-orange-500 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {loading && formData.paymentMethod === 'paystack' ? <Loader size="sm" color="white" /> : 'Pay with Paystack'}
                    </Button>
                  )}
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
                        src={
                          Array.isArray(item.product?.images) && item.product.images.length > 0
                            ? item.product.images[0]
                            : 'https://via.placeholder.com/150?text=No+Image'
                        }
                        alt={item.product?.name || 'Product'}
                        className="h-full w-full object-cover object-center"
                        onError={(e) => {
                          console.error(`Image failed to load for ${item.product?.name || 'Product'}:`, item.product?.images);
                          e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                        }}
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-900">
                          <h3>{item.product?.productName || 'Unnamed Product'}</h3>
                          <p className="ml-4">{formatPrice((item.product?.productPrice || 0) * item.quantity)}</p>
                        </div>
                        {item.product?.currentUser && (
                          <p className="text-xs text-gray-500 mt-1">Sold by: {item.product.currentUser.name}</p>
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
                    <p className="text-lg font-medium text-gray-900">
                      {formData.paymentMethod === 'cash_on_delivery' ? formatPrice(subtotal) : 'Pay with Paystack'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Including VAT</p>
                </div>
              </div>

              <div className="mt-6 hidden lg:block">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white py-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  {loading ? <Loader size="sm" color="white" /> : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

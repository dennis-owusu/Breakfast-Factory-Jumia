import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import Loader from '../../components/ui/Loader';
import { formatPrice } from '../../utils/helpers';
import { usePaystackPayment } from 'react-paystack';
import { v4 as uuidv4 } from 'uuid';
import { useRef } from 'react';

const OutletSellPage = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phoneNumber: '',
    email: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cashOnDelivery');
  const [orderId, setOrderId] = useState(null);
  const [triggerPayment, setTriggerPayment] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const orderIdRef = useRef(null);
  const [orderNumber, setOrderNumber] = useState(uuidv4());

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const initializePayment = usePaystackPayment({
    reference: orderNumber,
    email: currentUser?.email || 'outlet@example.com',
    amount: calculateTotal() * 100,
    publicKey,
    currency: 'GHS',
  });

  const triggerPaystackPayment = () => {
    initializePayment({
      onSuccess: handlePaystackSuccess,
      onClose: handlePaystackClose,
    });
  };

  useEffect(() => {
    if (triggerPayment) {
      triggerPaystackPayment();
      setTriggerPayment(false);
    }
  }, [triggerPayment]);

  const handlePaystackSuccess = async (reference) => {
    try {
      const response = await fetch('http://localhost:3000/api/route/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: reference.reference,
          userId: currentUser._id,
          orderId: orderIdRef.current,
          amount: calculateTotal(),
          phoneNumber: currentUser?.phoneNumber,
          currency: 'GHS',
          payerEmail: currentUser?.email || 'outlet@example.com',
          paymentMethod: 'paystack',
          status: 'paid',
        }),
      });
      if (response.ok) {
        setSuccess(true);
        setCart([]);
        setCustomerInfo({ name: '', phoneNumber: '', email: '' });
        setPaymentMethod('cashOnDelivery');
      setOrderNumber(uuidv4());
        toast.success('Payment successful and order processed!');
      } else {
        throw new Error('Failed to save transaction.');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to save transaction.');
    }
  };

  const handlePaystackClose = async () => {
    try {
      await fetch('http://localhost:3000/api/route/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: orderNumber,
          userId: currentUser._id,
          orderId: orderIdRef.current,
          amount: calculateTotal(),
          paymentMethod: 'paystack',
          currency: 'GHS',
          payerEmail: currentUser?.email || 'outlet@example.com',
          phoneNumber: currentUser?.phoneNumber,
          status: 'failed',
        }),
      });
    } catch (err) {
      console.error('Failed to log failed transaction:', err);
    }
    setError('Payment popup closed.');
    toast.error('Payment was not completed.');
  };

  // Fetch products for this outlet
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const headers = {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
        };

        const response = await fetch(`/api/route/allproducts`, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchProducts();
    }
  }, [currentUser]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Add product to cart
  const addToCart = async (product) => {
    try {
      // Fetch latest product data
      const response = await fetch(`/api/route/product/${product._id}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch product');
      }
      const latestProduct = data.product;
  
      const existingItem = cart.find(item => item._id === product._id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
  
      if (latestProduct.numberOfProductsAvailable < newQuantity) {
        toast.error(`${latestProduct.productName} is out of stock or insufficient quantity`);
        return;
      }
  
      setCart(prevCart => {
        if (existingItem) {
          return prevCart.map(item =>
            item._id === product._id
              ? { ...item, quantity: newQuantity }
              : item
          );
        } else {
          return [...prevCart, { ...latestProduct, quantity: 1 }];
        }
      });
      toast.success(`${latestProduct.productName} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  // Update product quantity in cart
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      // Fetch latest product data
      const response = await fetch(`/api/route/product/${productId}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch product');
      }
      const latestProduct = data.product;
  
      if (latestProduct.numberOfProductsAvailable < newQuantity) {
        toast.error(`${latestProduct.productName} has only ${latestProduct.numberOfProductsAvailable} in stock`);
        return;
      }
  
      setCart(prevCart =>
        prevCart.map(item =>
          item._id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity. Please try again.');
    }
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
    toast.success('Item removed from cart');
  };

  // Calculate cart total
  function calculateSubtotal() {
    return cart.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };
  
  function calculateFee() {
    const subtotal = calculateSubtotal();
    if (paymentMethod === 'paystack' || paymentMethod === 'mtnMomo') {
      return subtotal * 0.0195;
    }
    return 0;
  }
  
  function calculateTotal() {
    return calculateSubtotal() + calculateFee();
  }
  // Handle customer info change
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  // Process the order
  const processOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

     if (paymentMethod === 'paystack' && (!currentUser?.email || !currentUser.email.trim())) {
       toast.error('Email is required for Paystack payment');
       return;
     }

    // Validate phone number for MTN Mobile Money
    if (paymentMethod === 'mtnMomo' && (!currentUser?.phoneNumber || !currentUser?.phoneNumber.trim())) {
      toast.error('Phone number is required for MTN Mobile Money payment');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare order data
      const orderData = {
        
        userInfo: {
          name: customerInfo.name || 'No customer name',
          email: customerInfo.email || currentUser.email || 'No email',
          phoneNumber: customerInfo.phoneNumber || 'No phone Number'
        },
        products: cart.map(item => ({
          product: item._id,
          quantity: item.quantity
        })),
        totalPrice: calculateTotal(),
        address: 'In-store purchase', // For in-store purchases
        city: 'In-store',
        state: 'In-store',
        phoneNumber: customerInfo.phoneNumber || '0000000000',
        postalCode: '00000',
        paymentMethod: paymentMethod,
        status: paymentMethod === 'cashOnDelivery' ? 'delivered' : 'pending', // Mark as delivered immediately for cash payments
      };

      const headers = {
        'Content-Type': 'application/json',
        ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
      };

      // If using MTN Mobile Money, initiate payment first
      if (paymentMethod === 'mtnMomo') {
        try {
          // Initiate MTN Mobile Money payment
          const momoResponse = await fetch('/api/route/payments/mtn-momo/initiate', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              phoneNumber: customerInfo.phoneNumber,
              amount: calculateTotal(),
              description: `Payment for order at ${currentUser.outletName || 'our outlet'}`
            }),
          });

          let momoData;
          const momoResponseText = await momoResponse.text();
          
          try {
            // Only try to parse as JSON if there's content
            if (momoResponseText) {
              momoData = JSON.parse(momoResponseText);
            } else {
              throw new Error('Empty response received from payment gateway');
            }
          } catch (parseError) {
            console.error('JSON parsing error:', parseError, 'Response text:', momoResponseText);
            throw new Error(`Failed to parse payment response: ${momoResponseText || 'Empty response'}`);
          }
          
          if (!momoResponse.ok) {
            throw new Error(momoData?.message || `HTTP error ${momoResponse.status}`);
          }
          
          // Show payment initiation message
          toast.success(`Payment request sent to ${customerInfo.phoneNumber}. Please ask customer to check their phone and enter their PIN to complete payment.`);
          
          // Now create the order with pending status
          orderData.momoTransactionId = momoData.transactionId;
        } catch (momoError) {
          console.error('Error initiating MTN Mobile Money payment:', momoError);
          toast.error(momoError.message || 'Failed to initiate mobile money payment');
          setIsSubmitting(false);
          return;
        }
      }

      // Create the order
      const response = await fetch('/api/route/createOrder', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      let data;
      const responseText = await response.text();
      
      try {
        // Only try to parse as JSON if there's content
        if (responseText) {
          data = JSON.parse(responseText);
        } else {
          throw new Error('Empty response received from server');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError, 'Response text:', responseText);
        throw new Error(`Failed to parse order response: ${responseText || 'Empty response'}`);
      }
      
      if (!response.ok) {
        throw new Error(data?.message || `HTTP error ${response.status}`);
      }
      
      setOrderId(data._id);
      orderIdRef.current = data._id;

      if (paymentMethod === 'paystack') {
        setTriggerPayment(true);
        return;
      }
      
      if (paymentMethod === 'cashOnDelivery') {
        toast.success('Order processed successfully!');
      } else {
        toast.success('Order created! Waiting for payment confirmation.');
      }
      
      // Clear cart and reset customer info after successful order
      setCart([]);
      setCustomerInfo({
        name: '',
        phoneNumber: '',
        email: '',
      });
      setPaymentMethod('cashOnDelivery');
      
      // You could redirect to order details or print receipt here
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error(error.message || 'Failed to process order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Process In-Store Sale</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Selection Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product._id} className="overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{product.productName}</CardTitle>
                    <p className="font-semibold text-orange-600">{formatPrice(product.productPrice)}</p>
                  </CardHeader>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      onClick={() => addToCart(product)} 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Cart Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item._id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h3 className="font-medium">{item.productName}</h3>
                        <p className="text-sm text-gray-600">{formatPrice(item.productPrice)} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Customer Information */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Customer Information (Optional)</h3>
                <Input
                  placeholder="Customer Name"
                  name="name"

                  onChange={handleCustomerInfoChange}
                />
                <Input
                  placeholder="Phone Number"
                  name="phoneNumber"
                  value={customerInfo.phoneNumber}
                  onChange={handleCustomerInfoChange}
                  className={paymentMethod === 'mtnMomo' ? 'border-orange-500' : ''}
                />
                {paymentMethod === 'mtnMomo' && (
                  <p className="text-xs text-orange-600">* Required for MTN Mobile Money payment</p>
                )}
                <Input
                  placeholder="Email"
                  name="email"
                  type="email"
                  defaultValue={customerInfo.email ? customerInfo.email : currentUser.email}
                  onChange={handleCustomerInfoChange}
                />
              </div>
              
              {/* Payment Method */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" /> Mobile Money
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cashOnDelivery" id="cashOnDelivery" />
                    <Label htmlFor="cashOnDelivery" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                      Cash Payment
                    </Label>
                  </div>
                {/*   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mtnMomo" id="mtnMomo" />
                    <Label htmlFor="mtnMomo" className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-yellow-500" />
                      MTN Mobile Money
                    </Label>
                  </div> */}
                </RadioGroup>
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Fee (1.95%):</span>
                    <span>{formatPrice(calculateFee())}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center"
                disabled={cart.length === 0 || isSubmitting}
                onClick={processOrder}
              >
                {isSubmitting ? (
                  <Loader className="h-5 w-5" />
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Process Payment
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OutletSellPage;
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
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast.success(`${product.productName} added to cart`);
  };

  // Update product quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
    toast.success('Item removed from cart');
  };

  // Calculate cart total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

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

    // Validate phone number for MTN Mobile Money
    if (paymentMethod === 'mtnMomo' && (!customerInfo.phoneNumber || !customerInfo.phoneNumber.trim())) {
      toast.error('Phone number is required for MTN Mobile Money payment');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare order data
      const orderData = {
        user: currentUser._id, // Using outlet as the user for in-store orders
        userInfo: {
          name: customerInfo.name || 'Walk-in Customer',
          email: customerInfo.email || 'walkin@example.com',
          phoneNumber: customerInfo.phoneNumber || '0000000000'
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
      const response = await fetch('/api/route/orders', {
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
                  value={customerInfo.name}
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
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                />
              </div>
              
              {/* Payment Method */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cashOnDelivery" id="cashOnDelivery" />
                    <Label htmlFor="cashOnDelivery" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                      Cash Payment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mtnMomo" id="mtnMomo" />
                    <Label htmlFor="mtnMomo" className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-yellow-500" />
                      MTN Mobile Money
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
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
import React from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Truck, ShieldCheck } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

const CheckoutForm = ({ cartItems, subtotal, shipping, tax, total, onSubmit, isLoading }) => {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      paymentMethod: 'cashOnDelivery',
      saveInfo: false,
    },
  });

  const handleSubmit = (data) => {
    onSubmit({
      ...data,
      orderItems: cartItems.map(item => ({
        product: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      shippingAddress: {
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone
      },
      paymentMethod: data.paymentMethod,
      totalPrice: total
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  rules={{ 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  rules={{ required: 'Phone number is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-500" />
                <h2 className="text-xl font-semibold">Shipping Address</h2>
              </div>
              
              <FormField
                control={form.control}
                name="address"
                rules={{ required: 'Address is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  rules={{ required: 'City is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  rules={{ required: 'State/Province is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  rules={{ required: 'Postal code is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  rules={{ required: 'Country is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="saveInfo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Save this information for next time
                      </FormLabel>
                      <FormDescription>
                        We'll securely save your shipping details for future orders.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Payment Method */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <h2 className="text-xl font-semibold">Payment Method</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    rules={{ required: 'Payment method is required' }}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                id="cashOnDelivery" 
                                value="cashOnDelivery"
                                checked={field.value === 'cashOnDelivery'}
                                onChange={() => field.onChange('cashOnDelivery')}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                              />
                              <label htmlFor="cashOnDelivery" className="text-sm font-medium">
                                Cash on Delivery
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                id="paystack"
                                value="paystack"
                                checked={field.value === 'paystack'}
                                onChange={() => field.onChange('paystack')}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                                disabled
                              />
                              <label htmlFor="paystack" className="text-sm font-medium text-gray-400">
                                Paystack (Coming Soon)
                              </label>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:hidden">
              <OrderSummary 
                cartItems={cartItems}
                subtotal={subtotal}
                shipping={shipping}
                tax={tax}
                total={total}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Complete Order'}
            </Button>
          </form>
        </Form>
      </div>
      
      <div className="hidden lg:block">
        <OrderSummary 
          cartItems={cartItems}
          subtotal={subtotal}
          shipping={shipping}
          tax={tax}
          total={total}
        />
      </div>
    </div>
  );
};

const OrderSummary = ({ cartItems, subtotal, shipping, tax, total }) => {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your items</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
          {cartItems.map((item) => (
            <div key={item._id} className="flex items-center gap-3">
              <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <div className="text-sm text-gray-500 mt-1">
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
              <div className="text-right font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 rounded-b-lg">
        <div className="w-full flex items-center gap-2 text-sm text-gray-600">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Secure checkout with encrypted data</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CheckoutForm;
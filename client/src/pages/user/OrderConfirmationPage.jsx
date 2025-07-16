import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Package, AlertTriangle, MapPin, CreditCard } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { formatPrice } from '../../utils/helpers';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/user/orders/' + id);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/route/getOrder/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Order data:', data);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load order details');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [currentUser, id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Order not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/user/orders" className="text-orange-500 hover:text-orange-600 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
          </Link>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Order Confirmed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" /> Order Details
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Order ID:</p>
                    <p>{order._id}</p>
                  </div>
                  <div>
                    <p className="font-medium">Order Number:</p>
                    <p>{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium">Order Date:</p>
                    <p>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status:</p>
                    <p className="capitalize">{order.status}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total:</p>
                    <p>{formatPrice(order.totalPrice)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" /> Shipping Details
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Address:</p>
                    <p>{order.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">City:</p>
                    <p>{order.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">State:</p>
                    <p>{order.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Postal Code:</p>
                    <p>{order.postalCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone Number:</p>
                    <p>{order.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" /> Payment Details
                </h3>
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium">Payment Method:</p>
                  <p className="capitalize">{order.paymentMethod ? order.paymentMethod.replace('_', ' ') : 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
                <div className="space-y-4">
                  {order.products.length === 0 ? (
                    <p className="text-sm text-gray-500">No items in this order</p>
                  ) : (
                    order.products.map((item, index) => (
                      <div
                        key={item.product?._id || `product-${index}`}
                        className="flex py-4 border-b border-gray-200 last:border-0"
                      >
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
                              <h4>{item.product?.name || 'Unnamed Product'}</h4>
                              <p className="ml-4">
                                {formatPrice((item.product?.price || 0) * item.quantity)}
                              </p>
                            </div>
                            {item.product?.outlet && (
                              <p className="text-xs text-gray-500 mt-1">
                                Sold by: {item.product.outlet.name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-1 items-end justify-between text-xs">
                            <p className="text-gray-500">Qty {item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-lg font-medium text-gray-900">
                  <p>Total</p>
                  <p>{formatPrice(order.totalPrice)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Including VAT</p>
              </div>

              <div className="mt-6">
                <Button
                  asChild
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <Link to="/user/orders">View All Orders</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
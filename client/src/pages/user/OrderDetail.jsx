import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Truck, Package, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { userAPI } from '../../utils/api';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const response = await userAPI.getOrderById(id);
        setOrder(response.data.order);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.response?.data?.message || 'Failed to fetch order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id]);
  
  // Get status icon based on order status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'processing':
        return <Clock className="h-8 w-8 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-8 w-8 text-purple-500" />;
      case 'pending':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Package className="h-8 w-8 text-gray-500" />;
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get payment method display text
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'paystack':
        return 'Paystack (Online Payment)';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };
  
  // Get payment status badge color
  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Link to="/user/orders" className="inline-flex items-center text-orange-600 hover:text-orange-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline"> The order you're looking for doesn't exist or you don't have permission to view it.</span>
        </div>
        <div className="mt-4">
          <Link to="/user/orders" className="inline-flex items-center text-orange-600 hover:text-orange-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and Order ID */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <Link to="/user/orders" className="inline-flex items-center text-orange-600 hover:text-orange-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Order #{order.orderNumber}</h1>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>
      
      {/* Order Summary and Status */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              {getStatusIcon(order.status)}
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">Order Status</h2>
                <p className="text-gray-500">
                  {order.status === 'delivered' ? 'Your order has been delivered' :
                   order.status === 'shipped' ? 'Your order is on the way' :
                   order.status === 'processing' ? 'Your order is being processed' :
                   order.status === 'pending' ? 'Your order is pending' :
                   order.status === 'cancelled' ? 'Your order has been cancelled' :
                   'Status unknown'}
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Shipping Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden md:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Shipping Information</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Recipient</p>
              <p className="text-gray-900 font-medium">{order.shipping.fullName}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Address</p>
              <p className="text-gray-900">{order.shipping.address}</p>
              <p className="text-gray-900">{order.shipping.city}, {order.shipping.state}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="text-gray-900">{order.shipping.phone}</p>
            </div>
          </div>
        </div>
        
        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Payment Method</p>
              <p className="text-gray-900">{getPaymentMethodText(order.payment.method)}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Payment Status</p>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(order.payment.status)}`}>
                {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
              </span>
            </div>
            {order.payment.reference && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Payment Reference</p>
                <p className="text-gray-900 text-sm font-mono">{order.payment.reference}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Order Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.orderItems.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-md object-cover" 
                          src={item.product.images[0]} 
                          alt={item.product.name} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">{item.product.outlet.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPrice(item.price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPrice(item.price * item.quantity)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
        </div>
        <div className="p-6">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900 font-medium">{formatPrice(order.itemsPrice)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900 font-medium">{formatPrice(order.shippingPrice)}</span>
          </div>
          {order.taxPrice > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900 font-medium">{formatPrice(order.taxPrice)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 mt-2">
            <span className="text-gray-900 font-bold">Total</span>
            <span className="text-orange-600 font-bold text-xl">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
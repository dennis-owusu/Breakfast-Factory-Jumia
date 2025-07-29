import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Store,
  Phone,
  Mail
} from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import { adminAPI } from '../../utils/api';

// Use the real API function from our API utility
const fetchOrderDetails = async (orderId) => {
  try {
    const response = await adminAPI.getOrderById(orderId);
    return response.data;
  } catch (error) {
    // Fallback to mock data if API fails
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Generate mock order data
        const orderDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const itemsCount = Math.floor(Math.random() * 5) + 1;
        const subtotal = Math.floor(Math.random() * 50000) + 5000;
        const shippingFee = Math.floor(Math.random() * 2000) + 500;
        const tax = Math.floor(subtotal * 0.075);
        const totalAmount = subtotal + shippingFee + tax;
        
        const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        const paymentMethods = ['cash_on_delivery', 'card', 'bank_transfer'];
        const paymentStatuses = ['paid', 'pending', 'refunded'];
        
        const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        
        // Generate status history
        const statusHistory = [
          {
            status: 'created',
            timestamp: orderDate.toISOString(),
            note: 'Order has been created'
          }
        ];
        
        // Add pending status if not cancelled
        if (orderStatus !== 'cancelled') {
          statusHistory.push({
            status: 'pending',
            timestamp: new Date(orderDate.getTime() + (Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
            note: 'Order is pending processing'
          });
        }
        
        // Add processing status if beyond pending
        if (['processing', 'shipped', 'delivered'].includes(orderStatus)) {
          statusHistory.push({
            status: 'processing',
            timestamp: new Date(orderDate.getTime() + (Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString(),
            note: 'Order is being processed'
          });
        }
        
        // Add shipped status if beyond processing
        if (['shipped', 'delivered'].includes(orderStatus)) {
          statusHistory.push({
            status: 'shipped',
            timestamp: new Date(orderDate.getTime() + (Math.random() * 3 * 24 * 60 * 60 * 1000)).toISOString(),
            note: 'Order has been shipped via DHL Express'
          });
        }
        
        // Add delivered status if delivered
        if (orderStatus === 'delivered') {
          statusHistory.push({
            status: 'delivered',
            timestamp: new Date(orderDate.getTime() + (Math.random() * 4 * 24 * 60 * 60 * 1000)).toISOString(),
            note: 'Order has been delivered successfully'
          });
        }
        
        // Add cancelled status if cancelled
        if (orderStatus === 'cancelled') {
          statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(orderDate.getTime() + (Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
            note: 'Order was cancelled by the customer'
          });
        }
        
        // Sort status history by timestamp
        statusHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        resolve({
          _id: orderId,
          orderNumber: `ORD-${100000 + parseInt(orderId.replace(/\D/g, '') || '1')}`,
          customer: {
            _id: `user${Math.floor(Math.random() * 1000)}`,
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+2348012345678'
          },
          items: Array.from({ length: itemsCount }, (_, i) => ({
            _id: `item${i}`,
            product: {
              _id: `product${i * 10}`,
              name: `Product ${i * 10}`,
              image: `https://picsum.photos/id/${(i * 10) % 1000}/400/400`
            },
            price: Math.floor(Math.random() * 10000) + 1000,
            quantity: Math.floor(Math.random() * 3) + 1,
            outlet: {
              _id: `outlet${Math.floor(Math.random() * 10) + 1}`,
              name: `Outlet ${Math.floor(Math.random() * 10) + 1}`
            }
          })),
          shippingAddress: {
            street: '123 Main Street',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
            zipCode: '100001'
          },
          paymentMethod,
          paymentStatus,
          subtotal,
          shippingFee,
          tax,
          totalAmount,
          status: orderStatus,
          statusHistory,
          createdAt: orderDate.toISOString(),
          updatedAt: new Date(orderDate.getTime() + (Math.random() * 24 * 60 * 60 * 1000)).toISOString()
        });
      }, 1000);
    });
  }
};

const updateOrderStatus = async (orderId, status, note) => {
  try {
    const response = await adminAPI.updateOrderStatus(orderId, { status, note });
    return {
      success: true,
      message: response.data.message || `Order status updated to ${status}`
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update order status'
    };
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for status update
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  
  // Load order details
  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOrderDetails(id);
        setOrder(data);
        setNewStatus(data.status); // Initialize with current status
        setError(null);
      } catch (err) {
        setError('Failed to load order details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrderDetails();
  }, [id]);
  
  // Handle status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (newStatus === order.status) {
      setUpdateError('Please select a different status.');
      return;
    }
    
    try {
      setIsUpdating(true);
      setUpdateError('');
      setUpdateSuccess('');
      
      const result = await updateOrderStatus(id, newStatus, statusNote);
      
      if (result.success) {
        // Update local state
        const now = new Date().toISOString();
        setOrder(prevOrder => ({
          ...prevOrder,
          status: newStatus,
          statusHistory: [
            ...prevOrder.statusHistory,
            {
              status: newStatus,
              timestamp: now,
              note: statusNote || `Status updated to ${newStatus}`
            }
          ],
          updatedAt: now
        }));
        
        setUpdateSuccess(result.message);
        setStatusNote(''); // Clear note field
      } else {
        setUpdateError('Failed to update order status. Please try again.');
      }
    } catch (err) {
      setUpdateError('An error occurred. Please try again later.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'created':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get payment status badge color
  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to format payment method
  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      case 'card':
        return 'Card Payment';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex items-center text-red-500">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link to="/admin/orders" className="text-orange-600 hover:text-orange-900 flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <p className="text-gray-500">Order not found.</p>
            <div className="mt-4">
              <Link to="/admin/orders" className="text-orange-600 hover:text-orange-900 flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and order header */}
        <div className="mb-6">
          <Link to="/admin/orders" className="text-orange-600 hover:text-orange-900 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Order #{order.orderNumber}
            </h1>
            <div className="mt-2 sm:mt-0 flex items-center">
              <span className="mr-2 text-sm text-gray-500">
                {formatDate(order.createdAt)}
              </span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Status update form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Update Order Status</h3>
            
            {updateSuccess && (
              <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{updateSuccess}</p>
                  </div>
                </div>
              </div>
            )}
            
            {updateError && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{updateError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleStatusUpdate} className="mt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700">Note (Optional)</label>
                  <input
                    type="text"
                    name="note"
                    id="note"
                    className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Add a note about this status change"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  type="submit"
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Order Items</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {order.items.length} item(s) in this order
                </p>
              </div>
              
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li key={item._id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img className="h-16 w-16 rounded-md object-cover" src={item.product.image} alt={item.product.name} />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                Sold by: {item.outlet.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {formatPrice(item.price)} x {item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{order.customer.name}</span>
                </div>
                <div className="mt-2 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">{order.customer.email}</span>
                </div>
                <div className="mt-2 flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">{order.customer.phone}</span>
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Shipping Address</h3>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">{order.shippingAddress.street}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.zipCode}
                    </p>
                    <p className="text-sm text-gray-500">{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Information */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Information</h3>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{formatPaymentMethod(order.paymentMethod)}</span>
                  </div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(order.paymentStatus)}`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary and Status History */}
          <div>
            {/* Order Summary */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Order Summary</h3>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(order.subtotal)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Shipping Fee</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(order.shippingFee)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Tax</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(order.tax)}</dd>
                  </div>
                  <div className="sm:col-span-1 border-t pt-4">
                    <dt className="text-base font-medium text-gray-900">Total</dt>
                    <dd className="mt-1 text-base font-medium text-gray-900">{formatPrice(order.totalAmount)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Status History */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Status History</h3>
              </div>
              
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {order.statusHistory.map((statusItem, index) => (
                    <li key={index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getStatusBadgeColor(statusItem.status)}`}>
                            {statusItem.status === 'delivered' ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : statusItem.status === 'cancelled' ? (
                              <AlertTriangle className="h-5 w-5" />
                            ) : statusItem.status === 'shipped' ? (
                              <Truck className="h-5 w-5" />
                            ) : statusItem.status === 'processing' ? (
                              <Package className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {statusItem.status.charAt(0).toUpperCase() + statusItem.status.slice(1)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(statusItem.timestamp)} {new Date(statusItem.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {statusItem.note && (
                            <p className="text-sm text-gray-500 mt-1">{statusItem.note}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
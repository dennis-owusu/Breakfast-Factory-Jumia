import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Truck, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { outletAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';

// Function to fetch order details from API
const fetchOrderDetails = async (orderId) => {
  try {
    const response = await outletAPI.getOrderById(orderId);
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch order details');
  }
};

const updateOrderStatus = async (orderId, status, note) => {
  try {
    const response = await outletAPI.updateOrderStatus(orderId, { status, note });
    return {
      success: true,
      message: response.data.message || `Order status updated to ${status}`
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error(error.response?.data?.message || 'Failed to update order status');
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Load order details
  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOrderDetails(id);
        setOrder(data);
        setError(null);
      } catch (err) {
        const errorMessage = err.message || 'Failed to load order details. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrderDetails();
  }, [id]);
  
  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to update the order status to ${newStatus}?`)) {
      return;
    }
    
    try {
      setStatusUpdateLoading(true);
      const result = await updateOrderStatus(id, newStatus, statusNote);
      
      if (result.success) {
        // Update local state
        setOrder(prev => ({
          ...prev,
          status: newStatus,
          statusHistory: [
            ...prev.statusHistory,
            { status: newStatus, timestamp: new Date().toISOString(), note: statusNote }
          ]
        }));
        
        setSuccessMessage(result.message);
        toast.success(result.message);
        setStatusNote('');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        const errorMessage = 'Failed to update order status. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setStatusUpdateLoading(false);
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
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get next possible statuses based on current status
  const getNextPossibleStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return ['processing', 'cancelled'];
      case 'processing':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['delivered', 'cancelled'];
      case 'delivered':
        return [];
      case 'cancelled':
        return [];
      default:
        return [];
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
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
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
          <div className="flex">
            <button
              type="button"
              onClick={() => navigate('/outlet/orders')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <ChevronLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Order not found. It may have been deleted or you don't have permission to view it.
                </p>
              </div>
            </div>
          </div>
          <div className="flex">
            <button
              type="button"
              onClick={() => navigate('/outlet/orders')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <ChevronLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const nextPossibleStatuses = getNextPossibleStatuses(order.status);
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => navigate('/outlet/orders')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 mr-4"
              >
                <ChevronLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Back
              </button>
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Order {order.orderNumber}
              </h1>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Order Summary and Status Update */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Order Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={item.product.images[0] || 'https://via.placeholder.com/150'}
                                alt={item.product.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                              <div className="text-sm text-gray-500">
                                <Link to={`/products/${item.product._id}`} className="text-orange-500 hover:text-orange-600">
                                  View Product
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Status Update */}
            {nextPossibleStatuses.length > 0 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Update Order Status</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="status-note" className="block text-sm font-medium text-gray-700">
                        Status Note (optional)
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="status-note"
                          name="status-note"
                          rows={3}
                          className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Add a note about this status update"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {nextPossibleStatuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusUpdate(status)}
                          disabled={statusUpdateLoading}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${status === 'cancelled' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500'} ${statusUpdateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {status === 'processing' && <Package className="-ml-1 mr-2 h-5 w-5" />}
                          {status === 'shipped' && <Truck className="-ml-1 mr-2 h-5 w-5" />}
                          {status === 'delivered' && <CheckCircle className="-ml-1 mr-2 h-5 w-5" />}
                          {status === 'cancelled' && <XCircle className="-ml-1 mr-2 h-5 w-5" />}
                          Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status History */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Status History</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {order.statusHistory.map((statusItem, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== order.statusHistory.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusBadgeColor(statusItem.status).replace('text-', 'bg-').replace('bg-', 'text-')}`}>
                                {statusItem.status === 'pending' && (
                                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {statusItem.status === 'processing' && (
                                  <Package className="h-5 w-5 text-white" />
                                )}
                                {statusItem.status === 'shipped' && (
                                  <Truck className="h-5 w-5 text-white" />
                                )}
                                {statusItem.status === 'delivered' && (
                                  <CheckCircle className="h-5 w-5 text-white" />
                                )}
                                {statusItem.status === 'cancelled' && (
                                  <XCircle className="h-5 w-5 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  Status changed to <span className="font-medium text-gray-900">{statusItem.status.charAt(0).toUpperCase() + statusItem.status.slice(1)}</span>
                                  {statusItem.note && (
                                    <span className="text-gray-500"> - {statusItem.note}</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(statusItem.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Order Summary</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Shipping</span>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(order.shippingCost)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-medium text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Payment Method</span>
                    <span className="text-sm font-medium text-gray-900">{order.paymentMethod}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-sm text-gray-500">Payment Status</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                  <p className="mt-1 text-sm text-gray-900">{order.customer.name}</p>
                  <p className="mt-1 text-sm text-gray-900">{order.customer.email}</p>
                  <p className="mt-1 text-sm text-gray-900">{order.customer.phone}</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-500">Shipping Address</h4>
                  <p className="mt-1 text-sm text-gray-900">{order.shippingAddress.street}</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="mt-1 text-sm text-gray-900">{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
            
            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Order Notes</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <p className="text-sm text-gray-900">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

const generateOrderPDF = () => {
  const pdf = new jsPDF('p', 'pt', 'a4');
  let yPos = 40;
  pdf.setFontSize(22);
  pdf.text('Order Details', 40, yPos);
  yPos += 30;
  pdf.setFontSize(12);
  pdf.text(`Order ID: ${order._id}`, 40, yPos);
  yPos += 20;
  pdf.text(`Date: ${formatDate(order.createdAt)}`, 40, yPos);
  yPos += 20;
  pdf.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 40, yPos);
  yPos += 20;
  pdf.text(`Total: ${formatPrice(order.totalAmount)}`, 40, yPos);
  yPos += 30;
  pdf.setFontSize(14);
  pdf.text('Customer Information', 40, yPos);
  yPos += 20;
  pdf.setFontSize(12);
  pdf.text(`Name: ${order.customer.name}`, 40, yPos);
  yPos += 20;
  pdf.text(`Email: ${order.customer.email}`, 40, yPos);
  yPos += 20;
  pdf.text(`Phone: ${order.customer.phone}`, 40, yPos);
  yPos += 30;
  pdf.text('Shipping Address', 40, yPos);
  yPos += 20;
  pdf.text(order.shippingAddress.street, 40, yPos);
  yPos += 20;
  pdf.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 40, yPos);
  yPos += 20;
  pdf.text(order.shippingAddress.country, 40, yPos);
  yPos += 30;
  pdf.text('Order Items', 40, yPos);
  yPos += 20;
  order.items.forEach((item, index) => {
    pdf.text(`${index + 1}. ${item.productName} - Qty: ${item.quantity} - Price: ${formatPrice(item.price)}`, 40, yPos);
    yPos += 20;
  });
  if (order.notes) {
    yPos += 10;
    pdf.text('Notes: ' + order.notes, 40, yPos);
  }
  pdf.save(`order-${order._id}.pdf`);
};
// Remove the misplaced button code at the end
// In the return statement, after <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
<button onClick={generateOrderPDF} className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">Download PDF</button>
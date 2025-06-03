import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, CreditCard, Heart, LogOut, ChevronRight } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatDate, formatPrice } from '../../utils/helpers';

// This would be imported from an API utility file in a real app
const fetchUserOrders = async () => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          _id: 'ord123',
          orderNumber: 'ORD-12345',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: 12500,
          status: 'delivered',
          items: [
            { product: { name: 'Wireless Headphones', images: ['https://via.placeholder.com/150'] }, quantity: 1 },
            { product: { name: 'Smartphone Case', images: ['https://via.placeholder.com/150'] }, quantity: 2 }
          ]
        },
        {
          _id: 'ord456',
          orderNumber: 'ORD-67890',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: 35000,
          status: 'processing',
          items: [
            { product: { name: 'Smart Watch', images: ['https://via.placeholder.com/150'] }, quantity: 1 }
          ]
        }
      ]);
    }, 1000);
  });
};

const UserDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const data = await fetchUserOrders();
        setOrders(data);
        setError(null);
      } catch (err) {
        setError('Failed to load orders. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, []);
  
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
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Dashboard</h1>
          </div>
        </div>
        
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{user?.name || 'User'}</h2>
                <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                <p className="text-sm text-gray-500">Member since {formatDate(user?.createdAt || new Date())}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            <div className="px-6 py-5 text-center">
              <span className="text-sm font-medium text-gray-500">Total Orders</span>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{orders.length}</p>
            </div>
            <div className="px-6 py-5 text-center">
              <span className="text-sm font-medium text-gray-500">Wishlist Items</span>
              <p className="mt-1 text-3xl font-semibold text-gray-900">12</p>
            </div>
            <div className="px-6 py-5 text-center">
              <span className="text-sm font-medium text-gray-500">Reward Points</span>
              <p className="mt-1 text-3xl font-semibold text-gray-900">250</p>
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link to="/user/orders" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <ShoppingBag className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">My Orders</h3>
                <p className="text-sm text-gray-500">View your order history</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
          
          <Link to="/user/profile" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <User className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                <p className="text-sm text-gray-500">Update your information</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
          
          <Link to="/wishlist" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <Heart className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Wishlist</h3>
                <p className="text-sm text-gray-500">View saved items</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
          
          <Link to="/payment-methods" className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                <p className="text-sm text-gray-500">Manage your payment options</p>
              </div>
              <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        </div>
        
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader size="lg" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500">{error}</p>
              <button 
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
              <p className="text-gray-500 mb-4">When you place your first order, it will appear here.</p>
              <Link 
                to="/products" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={order.items[0]?.product.images[0] || 'https://via.placeholder.com/150'} 
                              alt="" 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">{order.items.length} item(s)</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/user/orders/${order._id}`} className="text-orange-500 hover:text-orange-600">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {orders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Link to="/user/orders" className="text-sm font-medium text-orange-500 hover:text-orange-600">
                View all orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
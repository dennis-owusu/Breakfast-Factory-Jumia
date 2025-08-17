import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Self-contained components and utilities (unchanged)
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>;
const Printer = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12V9H6z"/><path d="M12 21a2 2 0 0 1-2-2V14a2 2 0 0 1 4 0v5a2 2 0 0 1-2 2z"/></svg>;
const Button = ({ children, onClick, className = '' }) => (
  <button onClick={onClick} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 ${className}`}>
    {children}
  </button>
);
const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
    {children}
  </span>
);
const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
    <div className="w-12 h-12 border-4 border-t-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-500"></div>
  </div>
);
const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = React.Children.toArray(children).find(child => child.props.value === value);

  return (
    <div className="relative">
      <div
        className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:text-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedItem?.props.children || 'Update Status'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-popover-foreground shadow-md dark:text-gray-200">
          {React.Children.map(children, child => (
            <div
              className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700"
              onClick={() => {
                onValueChange(child.props.value);
                setIsOpen(false);
              }}
            >
              {child.props.children}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const SelectItem = ({ value, children }) => <div data-value={value}>{children}</div>;
const SelectTrigger = ({ children, className }) => <div className={className}>{children}</div>;
const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;

// Mock toast function
const toast = {
  success: (message) => console.log('Success:', message),
  error: (message) => console.error('Error:', message),
};

// Status badge color mapping
const statusColors = {
  pending: {
    light: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dark: 'dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800'
  },
  processing: {
    light: 'bg-blue-100 text-blue-800 border-blue-200',
    dark: 'dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800'
  },
  shipped: {
    light: 'bg-purple-100 text-purple-800 border-purple-200',
    dark: 'dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800'
  },
  delivered: {
    light: 'bg-green-100 text-green-800 border-green-200',
    dark: 'dark:bg-green-900 dark:text-green-200 dark:border-green-800'
  },
  cancelled: {
    light: 'bg-red-100 text-red-800 border-red-200',
    dark: 'dark:bg-red-900 dark:text-red-200 dark:border-red-800'
  }
};

const OutletOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser] = useState({ token: 'mock-token' });
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        };
        const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/getOrder/${id}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch order');
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) fetchOrder();
  }, [id, currentUser]);

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  const formatDate = (date) => new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatPrice = (price) => `GHS ${price.toFixed(2)}`;

  const handleStatusChange = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentUser.token}`,
      };
      const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/updateOrder/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: selectedStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      toast.success('Order status updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-600 dark:text-red-400 p-4">Error: {error}</div>;
  if (!order) return <div className="text-gray-800 dark:text-gray-300 p-4">Order not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-none overflow-hidden border border-gray-200 dark:border-slate-800">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">Order #{order.orderNumber || order._id}</h1>
          <div className="flex flex-col xs:flex-row w-full sm:w-auto space-y-2 xs:space-y-0 xs:space-x-3">
            <Button
              className="w-full sm:w-auto border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-200"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              className="w-full sm:w-auto border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-200 flex items-center justify-center gap-2"
              onClick={handlePrint}
            >
              <Printer className="h-5 w-5" />
              <span className="font-medium">Print Order</span>
            </Button>
          </div>
        </div>

        {/* Customer and Shipping Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-300">Name:</span> {order.user?.name || order.userInfo?.name || 'N/A'}
              </p>
              <p className="text-gray-700 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-300">Email:</span> {order.user?.email || order.userInfo?.email || 'N/A'}
              </p>
              <p className="text-gray-700 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-300">Phone:</span> {order.user?.phoneNumber || order.userInfo?.phoneNumber || order.phoneNumber || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Shipping Address</h2>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-400">
                {order.address}, {order.city}, {order.state} {order.postalCode}
              </p>
            </div>
          </div>
        </div>

        {/* Order details */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Order Details</h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Status</p>
              <Badge className={`mt-1 ${statusColors[order.status]?.light} ${statusColors[order.status]?.dark}`}>
                {order.status}
              </Badge>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-100 dark:border-green-900">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Date</p>
              <p className="mt-1 text-sm text-green-900 dark:text-green-300">{formatDate(order.createdAt)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 border border-purple-100 dark:border-purple-900">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Payment Method</p>
              <p className="mt-1 text-sm text-purple-900 dark:text-purple-300">{order.paymentMethod}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900">
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Total</p>
              <p className="mt-1 text-sm text-indigo-900 dark:text-indigo-300 font-bold">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </Select>
              <Button 
                onClick={handleStatusChange} 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Update Status
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-800 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">Image</th>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">Product</th>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">Quantity</th>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">Price</th>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((item, index) => (
                  <tr key={index} className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4">
                      <img
                        src={`${item.product.images[0]}`}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-slate-700"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                          e.target.className = 'w-16 h-16 object-contain rounded border border-gray-200 dark:border-slate-700 p-1';
                          toast.error(`Failed to load image for ${item.product.name}`);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{item.product.name}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">{formatPrice(item.product.price)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{formatPrice(item.product.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutletOrderDetail;
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Printer } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import Loader from '../../components/ui/Loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const OutletOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        };
        const response = await fetch(`/api/route/getOrder/${id}`, { headers });
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

  const formatDate = (date) => new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatPrice = (price) => `₦${price.toFixed(2)}`;

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!order) return <div>Order not found</div>;

  const [selectedStatus, setSelectedStatus] = useState(order.status);

  const handleStatusChange = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentUser.token}`,
      };
      const response = await fetch(`/api/route/updateOrder/${id}`, {
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order #{order.orderNumber || order._id}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(-1)}><ChevronLeft className="mr-2" /> Back</Button>
          <Button variant="outline"><Printer className="mr-2" /> Print</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Customer Information</h2>
          <p><strong>Name:</strong> {order.user?.name || order.userInfo?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {order.user?.email || order.userInfo?.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {order.user?.phoneNumber || order.userInfo?.phoneNumber || order.phoneNumber || 'N/A'}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Shipping Address</h2>
          <p>{order.address}, {order.city}, {order.state} {order.postalCode}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Order Details</h2>
        <p><strong>Status:</strong> <Badge>{order.status}</Badge></p>
        <div className="mt-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleStatusChange} className="ml-2">Update Status</Button>
        </div>
        <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
        <p><strong>Total:</strong> {formatPrice(order.totalPrice)}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Products</h2>
        <div className="space-y-4">
          {order.products.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 border-b pb-4">
              <img src={item.product.images[0]} alt={item.product.name} className="w-20 h-20 object-cover rounded" />
              <div>
                <p className="font-semibold">{item.product.name}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Price: {formatPrice(item.product.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OutletOrderDetail;
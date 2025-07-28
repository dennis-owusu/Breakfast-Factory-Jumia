import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Printer } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import Loader from '../../components/ui/Loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import jsPDF from 'jspdf';

const OutletOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const BASE_URL = 'http://localhost:3000'; // Backend base URL

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        };
        const response = await fetch(`${BASE_URL}/api/route/getOrder/${id}`, { headers });
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
      const response = await fetch(`${BASE_URL}/api/route/updateOrder/${id}`, {
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

  const generateOrderPDF = () => {
    const pdf = new jsPDF('p', 'pt', 'a4');
    let yPos = 60;
    pdf.setFontSize(24);
    pdf.setTextColor(0, 102, 204); // Blue for title
    pdf.text('Invoice', 40, yPos);
    pdf.setTextColor(0, 0, 0); // Reset to black
    yPos += 50;
    pdf.setFontSize(14);
    pdf.text(`Date: ${formatDate(order.createdAt)}`, 40, yPos);
    yPos += 30;
    pdf.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 40, yPos);
    yPos += 50;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 102, 204); // Blue for section header
    pdf.text('Customer', 40, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 30;
    pdf.setFontSize(12);
    pdf.text(`Name: ${order.user?.name || order.userInfo?.name || 'N/A'}`, 40, yPos);
    yPos += 25;
    pdf.text(`Email: ${order.user?.email || order.userInfo?.email || 'N/A'}`, 40, yPos);
    yPos += 50;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 102, 204);
    pdf.text('Order Items', 40, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 30;
    pdf.setFontSize(12);
    pdf.setDrawColor(0, 102, 204); // Blue for lines
    pdf.setLineWidth(0.5);
    pdf.line(40, yPos, 550, yPos);
    pdf.setDrawColor(0, 0, 0); // Reset to black
    yPos += 20;
    pdf.text('Product', 40, yPos);
    pdf.text('Qty', 300, yPos);
    pdf.text('Price', 370, yPos);
    pdf.text('Subtotal', 460, yPos);
    yPos += 10;
    pdf.setDrawColor(0, 102, 204);
    pdf.line(40, yPos, 550, yPos);
    pdf.setDrawColor(0, 0, 0);
    yPos += 20;
    order.products.forEach((item) => {
      pdf.text(item.product.name, 40, yPos);
      pdf.text(item.quantity.toString(), 300, yPos);
      pdf.text(formatPrice(item.product.price), 370, yPos);
      pdf.text(formatPrice(item.product.price * item.quantity), 460, yPos);
      yPos += 25;
    });
    pdf.setDrawColor(0, 102, 204);
    pdf.line(40, yPos, 550, yPos);
    pdf.setDrawColor(0, 0, 0);
    yPos += 30;
    pdf.setFontSize(14);
    pdf.setTextColor(255, 0, 0); // Red for total
    pdf.text(`Total: ${formatPrice(order.totalPrice)}`, 40, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.save(`order-${order.orderNumber || order._id}.pdf`);
  };

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Order #{order.orderNumber || order._id}</h1>
          <div className="flex flex-col xs:flex-row w-full sm:w-auto space-y-2 xs:space-y-0 xs:space-x-3">
            <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-gray-100" onClick={() => navigate(-1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-gray-100" onClick={generateOrderPDF}>
              <Printer className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p className="text-gray-600"><span className="font-medium">Name:</span> {order.user?.name || order.userInfo?.name || 'N/A'}</p>
              <p className="text-gray-600"><span className="font-medium">Email:</span> {order.user?.email || order.userInfo?.email || 'N/A'}</p>
              <p className="text-gray-600"><span className="font-medium">Phone:</span> {order.user?.phoneNumber || order.userInfo?.phoneNumber || order.phoneNumber || 'N/A'}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Shipping Address</h2>
            <div className="space-y-2">
              <p className="text-gray-600">{order.address}, {order.city}, {order.state} {order.postalCode}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Order Details</h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800">Status</p>
              <Badge className="mt-1 bg-blue-100 text-blue-800">{order.status}</Badge>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">Date</p>
              <p className="mt-1 text-sm text-green-900">{formatDate(order.createdAt)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-800">Payment Method</p>
              <p className="mt-1 text-sm text-purple-900">{order.paymentMethod}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-sm font-medium text-indigo-800">Total</p>
              <p className="mt-1 text-sm text-indigo-900 font-bold">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
              <Button onClick={handleStatusChange} className="w-full sm:w-auto">Update Status</Button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Products</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((item, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <img
                        src={`${item.product.images[0]}`}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                          toast.error(`Failed to load image for ${item.product.name}`);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.product.name}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">{formatPrice(item.product.price)}</td>
                    <td className="px-6 py-4 font-medium">{formatPrice(item.product.price * item.quantity)}</td>
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
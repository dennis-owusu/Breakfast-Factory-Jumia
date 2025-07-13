import React from 'react';
import { format } from 'date-fns';
import { Truck, Package, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const OrderStatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4 mr-1" /> };
      case 'shipped':
        return { color: 'bg-purple-100 text-purple-800', icon: <Truck className="h-4 w-4 mr-1" /> };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4 mr-1" /> };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-4 w-4 mr-1" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <Package className="h-4 w-4 mr-1" /> };
    }
  };

  const { color, icon } = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const OrderDetail = ({ order, isOutletOwner = false, onUpdateStatus }) => {
  const {
    _id,
    user,
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult,
    totalPrice,
    status,
    createdAt,
    updatedAt,
  } = order;

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(_id, newStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order #{_id.substring(0, 8)}</h1>
          <p className="text-gray-500">
            Placed on {format(new Date(createdAt), 'PPP')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={status} />
          
          {isOutletOwner && (
            <Select defaultValue={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Items in this order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item._id} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                  <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 mr-4 flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>Qty: {item.quantity}</span>
                      <span className="mx-2">•</span>
                      <span>${item.price.toFixed(2)} each</span>
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-gray-500">{orderItems.reduce((acc, item) => acc + item.quantity, 0)} items</div>
            <div className="font-bold text-lg">Total: ${totalPrice.toFixed(2)}</div>
          </CardFooter>
        </Card>

        {/* Order Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p>{shippingAddress.address}</p>
                <p>
                  {shippingAddress.city}, {shippingAddress.postalCode}
                </p>
                <p>{shippingAddress.country}</p>
                <p className="mt-2">
                  <span className="font-medium">Phone:</span> {shippingAddress.phone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                {paymentResult && (
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>ID: {paymentResult.id}</p>
                    <p>Status: {paymentResult.status}</p>
                    <p>Updated: {format(new Date(paymentResult.update_time), 'PPP')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Download Invoice</Button>
        {status !== 'cancelled' && !isOutletOwner && (
          <Button variant="destructive">Cancel Order</Button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
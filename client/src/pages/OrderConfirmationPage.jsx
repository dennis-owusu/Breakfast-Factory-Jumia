import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '../components/ui/button';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-amber-800 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-amber-900 mb-2">Order Confirmed!</h1>
        <p className="text-amber-700 mb-6">Thank you for your order. Your delicious drinks and pies are on the way!</p>
        <p className="text-sm text-gray-600 mb-8">Order ID: {orderId}</p>
        <div className="space-y-4">
          <Link to="/user/orders">
            <Button className="w-full bg-amber-800 hover:bg-amber-900 text-white">View Order Details</Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="w-full border-amber-800 text-amber-800 hover:bg-amber-100">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const CreditPaymentModal = ({ creditId, remainingAmount, onClose, onPaymentSuccess }) => {
  const { currentUser } = useSelector((state) => state.user);
  const [paymentAmount, setPaymentAmount] = useState(remainingAmount);
  const [loading, setLoading] = useState(false);

  const config = {
    reference: (new Date()).getTime().toString(),
    email: currentUser?.email || 'user@example.com',
    amount: paymentAmount * 100,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    if (paymentAmount <= 0 || paymentAmount > remainingAmount) {
      toast.error('Invalid payment amount');
      return;
    }

    initializePayment(onSuccess, onClosePayment);
  };

  const onSuccess = async (reference) => {
    setLoading(true);
    try {
      const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/credit/${creditId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: paymentAmount, paymentMethod: 'paystack', reference: reference.reference }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payment recorded successfully');
        onPaymentSuccess();
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error recording payment');
    } finally {
      setLoading(false);
    }
  };

  const onClosePayment = () => {
    toast('Payment cancelled');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Make Payment</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Amount to Pay</label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            min="1"
            max={remainingAmount}
          />
          <p className="text-sm text-gray-500 mt-1">Remaining: ${remainingAmount.toFixed(2)}</p>
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handlePayment} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Processing...' : 'Pay with Paystack'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditPaymentModal;
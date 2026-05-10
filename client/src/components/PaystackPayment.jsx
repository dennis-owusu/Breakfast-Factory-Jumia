import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { usePaystack } from '../hooks/usePaystack';
import { toast } from 'react-hot-toast';

/**
 * Paystack Payment Component
 * @param {Object} props - Component props
 * @param {number} props.amount - Amount to pay in GHS
 * @param {string} props.email - Customer email
 * @param {string} [props.orderId] - Associated order ID
 * @param {Function} props.onSuccess - Callback when payment succeeds
 * @param {Function} [props.onClose] - Callback when payment modal closes
 * @param {string} [props.buttonText] - Custom button text
 * @param {boolean} [props.disabled] - Whether button is disabled
 */
const PaystackPayment = ({
  amount,
  email,
  orderId,
  onSuccess,
  onClose,
  buttonText = 'Pay with Paystack',
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
  const { initializePayment, verifyPayment, isLoading, error } = usePaystack();

  // Handle payment initialization
  const handlePayment = async () => {
    if (!email || !amount) {
      toast.error('Email and amount are required');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Initialize payment
      const paymentData = await initializePayment({
        email,
        amount,
        orderId,
        callback_url: `${window.location.origin}/payment/verify`,
        metadata: {
          orderId,
          customerEmail: email,
        },
      });

      // Open Paystack payment popup
      const popup = window.open(
        paymentData.authorization_url,
        'PaystackPayment',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Poll for popup closure and payment status
      const checkPopupInterval = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkPopupInterval);
          
          // Verify payment status
          try {
            const verificationResult = await verifyPayment(paymentData.reference);
            
            if (verificationResult.status === 'success') {
              setPaymentStatus('success');
              toast.success('Payment successful!');
              onSuccess?.({
                reference: paymentData.reference,
                amount,
                status: 'success',
                data: verificationResult,
              });
            } else {
              setPaymentStatus('error');
              toast.error('Payment was not completed');
              onClose?.({
                reference: paymentData.reference,
                status: 'cancelled',
              });
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            setPaymentStatus('error');
            toast.error('Failed to verify payment');
          } finally {
            setIsProcessing(false);
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentStatus('error');
      setIsProcessing(false);
      toast.error(error.message || 'Failed to initialize payment');
    }
  };

  // Render button based on status
  const renderButton = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <Button
            disabled
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Payment Successful
          </Button>
        );
      case 'error':
        return (
          <Button
            onClick={handlePayment}
            disabled={disabled || isProcessing}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Retry Payment
          </Button>
        );
      case 'processing':
        return (
          <Button
            disabled
            className="w-full bg-orange-500 text-white"
          >
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </Button>
        );
      default:
        return (
          <Button
            onClick={handlePayment}
            disabled={disabled || isProcessing || !email || !amount}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        );
    }
  };

  return (
    <div className="w-full">
      {renderButton()}
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
      
      {/* Security Note */}
      {paymentStatus === 'idle' && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Secured by Paystack. Your payment information is encrypted and secure.
        </div>
      )}
    </div>
  );
};

export default PaystackPayment;

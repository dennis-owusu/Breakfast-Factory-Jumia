import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader as LoaderIcon } from 'lucide-react';
import Loader from '../components/ui/Loader';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { clearCart } from '../redux/slices/cartSlice';

const PaymentVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, failed
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setVerificationStatus('failed');
        setError('No payment reference found');
        return;
      }
      
      try {
        const response = await axios.get(`/api/orders/verify-payment/${reference}`);
        
        if (response.data.success) {
          setVerificationStatus('success');
          setOrderId(response.data.order._id);
          dispatch(clearCart());
        } else {
          setVerificationStatus('failed');
          setError(response.data.message || 'Payment verification failed');
        }
      } catch (error) {
        setVerificationStatus('failed');
        setError(error.response?.data?.message || 'An error occurred while verifying payment');
      }
    };
    
    verifyPayment();
  }, [reference, dispatch]);
  
  useEffect(() => {
    // Redirect after success or failure
    if (verificationStatus === 'success') {
      const timer = setTimeout(() => {
        navigate(orderId ? `/user/orders/${orderId}` : '/user/orders');
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (verificationStatus === 'failed') {
      const timer = setTimeout(() => {
        navigate('/cart');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, navigate, orderId]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {verificationStatus === 'loading' && (
          <div className="text-center">
            <Loader size="lg" />
            <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">Verifying Payment</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we verify your payment...
            </p>
          </div>
        )}
        
        {verificationStatus === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">Payment Successful!</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your payment has been verified successfully. You will be redirected to your order details shortly.
            </p>
            <div className="mt-6 flex items-center justify-center">
              <LoaderIcon className="animate-spin h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">Redirecting...</span>
            </div>
          </div>
        )}
        
        {verificationStatus === 'failed' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">Payment Verification Failed</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {error || 'We could not verify your payment. Please try again or contact support.'}
            </p>
            <p className="mt-2 text-center text-sm text-gray-500">
              You will be redirected back to your cart shortly.
            </p>
            <div className="mt-6 flex items-center justify-center">
              <LoaderIcon className="animate-spin h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">Redirecting...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerificationPage;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Phone } from 'lucide-react';

const MomoTestPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || !amount) {
      toast.error('Phone number and amount are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/route/payments/mtn-momo/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount: parseFloat(amount),
          description: 'Test MTN Mobile Money Payment'
        }),
      });
      
      let data;
      const responseText = await response.text();
      
      try {
        // Only try to parse as JSON if there's content
        if (responseText) {
          data = JSON.parse(responseText);
        } else {
          throw new Error('Empty response received');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError, 'Response text:', responseText);
        throw new Error(`Failed to parse response: ${responseText || 'Empty response'}`);
      }
      
      if (!response.ok) {
        throw new Error(data?.message || `HTTP error ${response.status}`);
      }
      setTransactionId(data.transactionId);
      
      toast.success(`Payment request sent to ${data.phoneNumber}. Please check your phone and enter your PIN to complete payment.`);
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyPayment = async () => {
    if (!transactionId) {
      toast.error('No transaction to verify');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real app, this would be triggered by a webhook
      // This is just for testing purposes
      const response = await fetch(`/api/route/payments/mtn-momo/verify/${transactionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SUCCESSFUL'
        }),
      });
      
      let responseData;
      const responseText = await response.text();
      
      try {
        // Only try to parse as JSON if there's content
        if (responseText) {
          responseData = JSON.parse(responseText);
        } else {
          // For verification endpoint, empty response is acceptable
          responseData = { success: true };
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError, 'Response text:', responseText);
        throw new Error(`Failed to parse response: ${responseText || 'Empty response'}`);
      }
      
      if (!response.ok) {
        throw new Error(responseData?.message || `HTTP error ${response.status}`);
      }
      
      toast.success('Payment verified successfully!');
      
      // In a real app, you would redirect to an order confirmation page
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold mb-8 text-center">MTN Mobile Money Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="mr-2 text-yellow-500" />
            Test MTN Mobile Money Payment
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleInitiatePayment} className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                placeholder="e.g., 0241234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Ghana number format (e.g., 0241234567)</p>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Amount (GHS)
              </label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g., 10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-yellow-500 hover:bg-yellow-600"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Initiate Payment'}
            </Button>
          </form>
          
          {transactionId && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">Transaction Details</h3>
              <p className="text-sm">Transaction ID: {transactionId}</p>
              <p className="text-sm mt-2">Status: Pending</p>
              <p className="text-xs text-gray-500 mt-2">
                In a real implementation, the payment status would be updated automatically via webhook.
                For testing purposes, use the button below to simulate a successful payment.
              </p>
            </div>
          )}
        </CardContent>
        
        {transactionId && (
          <CardFooter>
            <Button 
              onClick={handleVerifyPayment} 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Simulate Successful Payment'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default MomoTestPage;
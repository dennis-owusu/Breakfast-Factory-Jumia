import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatPrice, formatDate } from '../../utils/helpers';

const OutletTransactions = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        };
        
        // Get outlet ID from current user if they are an outlet
        const outletId = currentUser?.usersRole === 'outlet' ? currentUser._id : null;
        const url = outletId 
          ? `https://breakfast-factory-jumia.onrender.com/api/route/payments` 
          : 'https://breakfast-factory-jumia.onrender.com/api/route/payments';
          
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        if (data && data.payments) {
          setTransactions(data.payments);
        } else {
          setTransactions([]);
          setError('No transaction data available');
        }
      } catch (err) {
        console.error('Transaction fetch error:', err);
        setError(err.message || 'Failed to load transactions');
        toast.error(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) fetchTransactions();
  }, [currentUser]);

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tx.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.referenceId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(tx.amount)} {tx.currency}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.paymentMethod}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={tx.status === 'paid' || tx.status === 'successful' ? 'success' : 'destructive'}>
                    {tx.status === 'paid' ? 'Success' : tx.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutletTransactions;
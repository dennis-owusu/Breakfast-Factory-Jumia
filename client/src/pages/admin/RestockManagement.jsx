import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';

const RestockManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRestockRequests();
  }, []);

  const fetchRestockRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/route/all');
      const data = await response.json();
      setRequests(data.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId, status, adminNote) => {
    try {
      setProcessingId(requestId);
      const response = await fetch(`/api/route/process/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      // Update the local state
      setRequests(requests.map(req => 
        req._id === requestId 
          ? { ...req, status, adminNote, processedAt: new Date().toISOString() }
          : req
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 dark:text-gray-100">Restock Requests Management</h1>

      <Card className="dark:bg-gray-800 dark:border-gray-700 shadow-lg">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              Loading requests...
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              No restock requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Outlet</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Product</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Current Qty</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Requested Qty</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Reason</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {requests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4 text-gray-900 dark:text-gray-300 font-medium">{request.outlet.name}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{request.product?.productName || 'Unknown Product'}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{request.currentQuantity}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold text-orange-600 dark:text-orange-400">{request.requestedQuantity}</td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 italic max-w-xs truncate">{request.reason}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {request.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => {
                                const note = prompt('Add a note (optional):');
                                handleProcessRequest(request._id, 'approved', note);
                              }}
                              disabled={processingId === request._id}
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              size="sm"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                const note = prompt('Add a reason for rejection:');
                                if (note) handleProcessRequest(request._id, 'rejected', note);
                              }}
                              disabled={processingId === request._id}
                              className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                              size="sm"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.adminNote && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-2 rounded">
                            <span className="font-semibold">Note:</span> {request.adminNote}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RestockManagement;

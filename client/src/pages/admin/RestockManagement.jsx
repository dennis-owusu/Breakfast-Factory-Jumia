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
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Restock Requests Management</h1>

      <Card>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-4">Loading requests...</div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4">No restock requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Outlet</th>
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Current Qty</th>
                    <th className="text-left py-3 px-4">Requested Qty</th>
                    <th className="text-left py-3 px-4">Reason</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{request.outlet.name}</td>
                      <td className="py-3 px-4">{request.product?.productName || 'Unknown Product'}</td>
                      <td className="py-3 px-4">{request.currentQuantity}</td>
                      <td className="py-3 px-4">{request.requestedQuantity}</td>
                      <td className="py-3 px-4">{request.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                const note = prompt('Add a note (optional):');
                                handleProcessRequest(request._id, 'approved', note);
                              }}
                              disabled={processingId === request._id}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                const note = prompt('Add a reason for rejection:');
                                if (note) handleProcessRequest(request._id, 'rejected', note);
                              }}
                              disabled={processingId === request._id}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.adminNote && (
                          <div className="mt-2 text-sm text-gray-600">
                            Note: {request.adminNote}
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
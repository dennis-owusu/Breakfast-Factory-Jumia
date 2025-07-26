import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createRestockRequest, fetchOutletRestockRequests, clearSuccess, clearError } from '../../redux/slices/restockSlice';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

const OutletRestock = () => {
  const dispatch = useDispatch();
  const { requests, loading, error, success } = useSelector((state) => state.restock);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    productId: searchParams.get('productId') || '',
    requestedQuantity: '',
    currentQuantity: searchParams.get('quantity') || ''
  });

  useEffect(() => {
    dispatch(fetchOutletRestockRequests());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setFormData({ productId: '', requestedQuantity: '', reason: '' });
      setTimeout(() => dispatch(clearSuccess()), 3000);
    }
  }, [success, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createRestockRequest(formData));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      <h1 className="text-3xl font-bold mb-8">Restock Management</h1>

      {/* Restock Request Form */}
      <Card className="mb-8">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Create Restock Request</h2>
          
          <div className="space-y-2">
            <label className="block font-medium">Current Stock</label>
            <Input
              value={formData.currentQuantity}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="requestedQuantity" className="block font-medium">Add Quantity</label>
            <Input
              id="requestedQuantity"
              name="requestedQuantity"
              type="number"
              min="1"
              value={formData.requestedQuantity}
              onChange={handleChange}
              required
              placeholder="Enter quantity to add"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/outlet/products')}>
              Cancel
            </Button>
          </div>

          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}

          {success && (
            <p className="text-green-500 mt-2">Restock request created successfully!</p>
          )}
        </form>
      </Card>

      {/* Restock Requests List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Restock Requests</h2>

          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p>No restock requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Outlet</th>
                    <th className="text-left py-3 px-4">Requested Qty</th>
                    <th className="text-left py-3 px-4">Current Qty</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Admin Note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{request.product.productName}</td>
                      <td className="py-3 px-4">{request.outlet?.storeName || request.outlet?.name || request.outlet?.email || 'Unknown Outlet'}</td>
                      <td className="py-3 px-4">{request.requestedQuantity}</td>
                      <td className="py-3 px-4">{request.currentQuantity}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{request.adminNote || '-'}</td>
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

export default OutletRestock;
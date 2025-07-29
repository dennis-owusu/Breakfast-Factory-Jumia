import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaMoneyBillWave, FaCalendarAlt, FaUserAlt, FaFileInvoiceDollar } from 'react-icons/fa';
import { MdPayment } from 'react-icons/md';
import { toast } from 'react-toastify';

const OutletCredit = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch credit transactions
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://breakfast-factory-jumia.onrender.com/api/route/credit/outlet/${currentUser._id}?page=${currentPage}&status=${statusFilter}&search=${searchInput}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch credit transactions');
        }

        setCredits(data.credits || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [currentUser._id, currentPage, statusFilter, searchInput]);

  // Fetch credit summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/credit/summary?outletId=${currentUser._id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch credit summary');
        }

        setSummary(data);
      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchSummary();
  }, [currentUser._id, credits]);

  // Handle record payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedCredit) return;
    
    try {
      const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/credit/${selectedCredit._id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          notes: paymentNote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record payment');
      }

      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      setSelectedCredit(null);
      
      // Refresh credits list
      const updatedCredits = credits.map(credit => 
        credit._id === data.credit._id ? data.credit : credit
      );
      setCredits(updatedCredits);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Open payment modal
  const openPaymentModal = (credit) => {
    setSelectedCredit(credit);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-6">Credit Management</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaMoneyBillWave size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Credit Amount</p>
                <p className="text-xl font-semibold">${summary.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <MdPayment size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining Amount</p>
                <p className="text-xl font-semibold">${summary.remainingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                <FaCalendarAlt size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue Credits</p>
                <p className="text-xl font-semibold">{summary.overdueCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <FaUserAlt size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-xl font-semibold">{summary.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name or order number"
              className="w-full p-2 border rounded"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full p-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Credits List */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : credits.length === 0 ? (
        <div className="text-center py-4">No credit transactions found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {credits.map((credit) => (
                  <tr key={credit._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {credit.user?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {credit.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {credit.order?.orderNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(credit.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${credit.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Remaining: ${credit.remainingAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(credit.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(credit.status)}`}>
                        {credit.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openPaymentModal(credit)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        disabled={credit.status === 'paid'}
                      >
                        Record Payment
                      </button>
                      <button
                        onClick={() => window.open(`/order/${credit.order?._id}`, '_blank')}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border ${currentPage === page ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Customer: {selectedCredit.user?.name}</p>
              <p className="text-sm text-gray-600 mb-1">Order: {selectedCredit.order?.orderNumber}</p>
              <p className="text-sm text-gray-600 mb-1">Total Amount: ${selectedCredit.amount.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mb-1">Remaining: ${selectedCredit.remainingAmount.toFixed(2)}</p>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedCredit.remainingAmount}
                  required
                  className="w-full p-2 border rounded"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows="3"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutletCredit;
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaMoneyBillWave, FaCalendarAlt, FaFileInvoiceDollar } from 'react-icons/fa';
import { MdPayment } from 'react-icons/md';
import { toast } from 'react-toastify';
import CreditPaymentModal from '../../components/CreditPaymentModal';

const UserCredit = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [creditSummary, setCreditSummary] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);

  const handleMakePayment = (credit) => {
    if (credit.remainingAmount > 0 && ['pending', 'partially_paid', 'overdue'].includes(credit.status)) {
      setSelectedCredit(credit);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh credits
    fetchCredits();
  };

  // Fetch credit transactions
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/route/credit/user/${currentUser._id}?page=${currentPage}&status=${statusFilter}`,
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
        setCreditSummary(data.summary || null);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [currentUser._id, currentPage, statusFilter]);

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

  // Calculate days remaining or overdue
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `${diffDays} days remaining`;
    }
  };

  // Get days remaining class
  const getDaysRemainingClass = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'text-red-600';
    } else if (diffDays <= 3) {
      return 'text-yellow-600';
    } else {
      return 'text-green-600';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-6">My Credit History</h1>

      {/* Credit Limit Info */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Credit Limit</h2>
            <p className="text-gray-600">
              Your current credit limit is{' '}
              <span className="font-semibold">
                ${currentUser.creditLimit?.toFixed(2) || '0.00'}
              </span>
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium">Credit Used</h2>
            <p className="text-gray-600">
              You have used{' '}
              <span className="font-semibold">
                ${currentUser.totalCreditUsed?.toFixed(2) || '0.00'}
              </span>{' '}
              of your credit limit
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium">Available Credit</h2>
            <p className="text-gray-600">
              You have{' '}
              <span className="font-semibold">
                ${
                  ((currentUser.creditLimit || 0) - (currentUser.totalCreditUsed || 0)).toFixed(2)
                }
              </span>{' '}
              available credit
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {creditSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaMoneyBillWave size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Credit Amount</p>
                <p className="text-xl font-semibold">${creditSummary.totalAmount.toFixed(2)}</p>
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
                <p className="text-xl font-semibold">${creditSummary.remainingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                <FaCalendarAlt size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming Payments</p>
                <p className="text-xl font-semibold">{creditSummary.upcomingCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
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
                      <div className="text-sm text-gray-900">
                        {credit.order?.orderNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(credit.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {credit.outlet?.storeName || credit.outlet?.name || 'N/A'}
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
                      <div className={`text-sm ${getDaysRemainingClass(credit.dueDate)}`}>
                        {getDaysRemaining(credit.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(credit.status)}`}>
                        {credit.status.replace('_', ' ')}
                      </span>
                    </td>
                    // In the table, add to actions
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.open(`/order/${credit.order?._id}`, '_blank')}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        View Order
                      </button>
                      {credit.remainingAmount > 0 && ['pending', 'partially_paid', 'overdue'].includes(credit.status) && (
                        <button
                          onClick={() => handleMakePayment(credit)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Make Payment
                        </button>
                      )}
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

      {/* Payment History */}
      {credits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          {credits.some(credit => credit.payments && credit.payments.length > 0) ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {credits
                      .filter(credit => credit.payments && credit.payments.length > 0)
                      .flatMap(credit => 
                        credit.payments.map(payment => ({
                          ...payment,
                          orderNumber: credit.order?.orderNumber,
                          storeName: credit.outlet?.storeName || credit.outlet?.name
                        }))
                      )
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((payment, index) => (
                        <tr key={payment._id || index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(payment.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {payment.orderNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {payment.storeName || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${payment.amount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {payment.notes || '-'}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-white rounded-lg shadow">
              No payment history found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserCredit;

{showPaymentModal && selectedCredit && (
  <CreditPaymentModal
    creditId={selectedCredit._id}
    remainingAmount={selectedCredit.remainingAmount}
    onClose={() => setShowPaymentModal(false)}
    onPaymentSuccess={handlePaymentSuccess}
  />
)}
};
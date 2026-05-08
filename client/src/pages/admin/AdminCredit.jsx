import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaMoneyBillWave, FaCalendarAlt, FaUserAlt, FaFileInvoiceDollar, FaStore } from 'react-icons/fa';
import { MdPayment, MdEdit } from 'react-icons/md';
import { toast } from 'react-toastify';

const AdminCredit = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [outletFilter, setOutletFilter] = useState('all');
  const [outlets, setOutlets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showCreditLimitModal, setShowCreditLimitModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newCreditLimit, setNewCreditLimit] = useState('');

  // Fetch credit transactions
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/route/credit?page=${currentPage}&status=${statusFilter}&outlet=${outletFilter}&search=${searchInput}`,
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
  }, [currentPage, statusFilter, outletFilter, searchInput]);

  // Fetch outlets for filter
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await fetch('/api/auth/outlets', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch outlets');
        }

        setOutlets(data.outlets || []);
      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchOutlets();
  }, []);

  // Fetch credit summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/route/credit/summary', {
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
  }, [credits]);

  // Handle record payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedCredit) return;
    
    try {
      const response = await fetch(`/api/route/credit/${selectedCredit._id}/payment`, {
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

  // Handle update credit transaction
  const handleUpdateCredit = async (e) => {
    e.preventDefault();
    
    if (!selectedCredit) return;
    
    try {
      const response = await fetch(`/api/route/credit/${selectedCredit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dueDate: editDueDate,
          status: editStatus,
          notes: editNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update credit transaction');
      }

      toast.success('Credit transaction updated successfully');
      setShowEditModal(false);
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

  // Handle update credit limit
  const handleUpdateCreditLimit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/route/credit/user/${selectedUser._id}/credit-limit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          creditLimit: parseFloat(newCreditLimit),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update credit limit');
      }

      toast.success(`Credit limit updated for ${selectedUser.name}`);
      setShowCreditLimitModal(false);
      setSelectedUser(null);
      setNewCreditLimit('');
      
      // Refresh credits list to reflect the updated user info
      const fetchCredits = async () => {
        try {
          const response = await fetch(
            `/api/route/credit?page=${currentPage}&status=${statusFilter}&outlet=${outletFilter}&search=${searchInput}`,
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
        } catch (err) {
          toast.error(err.message);
        }
      };

      fetchCredits();
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

  // Open edit modal
  const openEditModal = (credit) => {
    setSelectedCredit(credit);
    setEditDueDate(credit.dueDate.split('T')[0]); // Format date for input
    setEditStatus(credit.status);
    setEditNotes(credit.notes || '');
    setShowEditModal(true);
  };

  // Open credit limit modal
  const openCreditLimitModal = (user) => {
    setSelectedUser(user);
    setNewCreditLimit(user.creditLimit || 0);
    setShowCreditLimitModal(true);
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
              placeholder="Search by customer name, email, or order number"
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
          <div className="w-full md:w-48">
            <select
              className="w-full p-2 border rounded"
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
            >
              <option value="all">All Outlets</option>
              {outlets.map((outlet) => (
                <option key={outlet._id} value={outlet._id}>
                  {outlet.storeName || outlet.name}
                </option>
              ))}
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
                    Outlet
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
                          <button
                            onClick={() => openCreditLimitModal(credit.user)}
                            className="text-xs text-indigo-600 hover:text-indigo-900"
                          >
                            Credit Limit: ${credit.user?.creditLimit?.toFixed(2) || '0.00'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {credit.outlet?.storeName || credit.outlet?.name || 'N/A'}
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
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        disabled={credit.status === 'paid'}
                      >
                        Payment
                      </button>
                      <button
                        onClick={() => openEditModal(credit)}
                        className="text-yellow-600 hover:text-yellow-900 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => window.open(`/order/${credit.order?._id}`, '_blank')}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Order
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border ${currentPage === pageNum ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
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
              <p className="text-sm text-gray-600 mb-1">Outlet: {selectedCredit.outlet?.storeName || selectedCredit.outlet?.name}</p>
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

      {/* Edit Modal */}
      {showEditModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Credit Transaction</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Customer: {selectedCredit.user?.name}</p>
              <p className="text-sm text-gray-600 mb-1">Outlet: {selectedCredit.outlet?.storeName || selectedCredit.outlet?.name}</p>
              <p className="text-sm text-gray-600 mb-1">Order: {selectedCredit.order?.orderNumber}</p>
              <p className="text-sm text-gray-600 mb-1">Amount: ${selectedCredit.amount.toFixed(2)}</p>
            </div>
            <form onSubmit={handleUpdateCredit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border rounded"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows="3"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Limit Modal */}
      {showCreditLimitModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Update Credit Limit</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Customer: {selectedUser.name}</p>
              <p className="text-sm text-gray-600 mb-1">Email: {selectedUser.email}</p>
              <p className="text-sm text-gray-600 mb-1">Current Credit Limit: ${selectedUser.creditLimit?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-600 mb-1">Credit Used: ${selectedUser.totalCreditUsed?.toFixed(2) || '0.00'}</p>
            </div>
            <form onSubmit={handleUpdateCreditLimit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Credit Limit</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full p-2 border rounded"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowCreditLimitModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Update Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCredit;
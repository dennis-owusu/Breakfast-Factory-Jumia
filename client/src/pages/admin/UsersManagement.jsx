import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  UserX,
  UserCheck,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

const UsersManagement = () => {
  // ... (keep all the existing state and functions)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { currentUser } = useSelector((state) => state.user);

  // Fetch users on component mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [search, role, status, page]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search,
        role,
        status,
        page,
        limit: 10
      };
      const result = await fetchUsers(params);
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(true);
    try {
      await updateUserStatus(userId, newStatus);
      setSuccessMessage(`User status updated to ${newStatus}`);
      toast.success(`User status updated to ${newStatus}`);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await updateUserRole(userId, newRole);
      setSuccessMessage(`User role updated to ${newRole}`);
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user role');
      toast.error(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function to get role badge color with dark mode
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'outlet':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Helper function to get status badge color with dark mode
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role) => {
    if (!role) return 'Unknown';
    
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'outlet':
        return 'Outlet Owner';
      case 'user':
        return 'Customer';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
            Users Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all users, outlets, and administrators on the platform
          </p>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">Search</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Search
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          {isLoading && !users.length ? (
            <div className="px-4 py-12 text-center">
              <Loader size="lg" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading users...</p>
            </div>
          ) : !isLoading && !users.length ? (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No users found. Try a different search or add a new user.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.usersRole)}`}>
                          {getRoleDisplayName(user.usersRole)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                          {user.status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/users/${user._id}`}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                            title="View"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/admin/users/${user._id}/edit`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(user._id, 'inactive')}
                              disabled={actionLoading}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                              title="Deactivate"
                            >
                              <UserX className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(user._id, 'active')}
                              disabled={actionLoading}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50"
                              title="Activate"
                            >
                              <UserCheck className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(page > 1 ? page - 1 : 1)}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${page === 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${page === totalPages ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;

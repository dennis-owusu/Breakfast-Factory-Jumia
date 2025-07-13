import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Loader from '../../components/ui/Loader';

import { adminAPI } from '../../utils/api';

// Use the real API function from our API utility
const fetchCategories = async (params) => {
  try {
    const response = await adminAPI.getCategories(params);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
      
      // Filter by search term
      let filteredCategories = allCategories;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredCategories = allCategories.filter(cat => 
          cat.name.toLowerCase().includes(searchLower) || 
          cat.description.toLowerCase().includes(searchLower) ||
          (cat.parentName && cat.parentName.toLowerCase().includes(searchLower))
        );
      }
      
      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
      
      resolve({
        categories: paginatedCategories,
        totalCategories: filteredCategories.length,
        totalPages: Math.ceil(filteredCategories.length / limit),
        currentPage: page
      });
    }, 1000);
  });
};

const deleteCategory = async (id) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Category deleted successfully' });
    }, 1000);
  });
};

const updateCategoryStatus = async (id, status) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: `Category ${status === 'active' ? 'activated' : 'deactivated'} successfully` });
    }, 1000);
  });
};

const updateCategoryFeatured = async (id, featured) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: `Category ${featured ? 'marked as featured' : 'removed from featured'} successfully` });
    }, 1000);
  });
};

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState({
    id: null,
    type: null
  });
  
  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await fetchCategories({
          search,
          page: currentPage,
          limit: 10
        });
        
        setCategories(result.categories);
        setTotalPages(result.totalPages);
        setTotalCategories(result.totalCategories);
        setCurrentPage(result.currentPage);
      } catch (err) {
        setError('Failed to load categories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [search, currentPage]);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Handle delete
  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      setError(null);
      
      const result = await deleteCategory(id);
      
      if (result.success) {
        setSuccessMessage(result.message);
        // Remove from state
        setCategories(prev => prev.filter(cat => cat.id !== id));
        // Update total count
        setTotalCategories(prev => prev - 1);
        // Update total pages
        setTotalPages(Math.ceil((totalCategories - 1) / 10));
        // If current page is now empty and not the first page, go to previous page
        if (categories.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        setError(result.message || 'Failed to delete category');
      }
    } catch (err) {
      setError('An error occurred while deleting the category');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    }
  };
  
  // Handle status change
  const handleStatusChange = async (id, currentStatus) => {
    try {
      setActionLoading({
        id,
        type: 'status'
      });
      setError(null);
      
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const result = await updateCategoryStatus(id, newStatus);
      
      if (result.success) {
        setSuccessMessage(result.message);
        // Update in state
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, status: newStatus } : cat
        ));
      } else {
        setError(result.message || 'Failed to update category status');
      }
    } catch (err) {
      setError('An error occurred while updating the category status');
    } finally {
      setActionLoading({
        id: null,
        type: null
      });
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    }
  };
  
  // Handle featured change
  const handleFeaturedChange = async (id, currentFeatured) => {
    try {
      setActionLoading({
        id,
        type: 'featured'
      });
      setError(null);
      
      const result = await updateCategoryFeatured(id, !currentFeatured);
      
      if (result.success) {
        setSuccessMessage(result.message);
        // Update in state
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, featured: !currentFeatured } : cat
        ));
      } else {
        setError(result.message || 'Failed to update category featured status');
      }
    } catch (err) {
      setError('An error occurred while updating the category featured status');
    } finally {
      setActionLoading({
        id: null,
        type: null
      });
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Categories Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage product categories for your e-commerce store
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/admin/categories/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add New Category
            </Link>
          </div>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search by name or description"
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
            </form>
          </div>
        </div>
        
        {/* Categories table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading && !categories.length ? (
            <div className="px-4 py-12 text-center">
              <Loader size="lg" />
              <p className="mt-4 text-gray-500">Loading categories...</p>
            </div>
          ) : !isLoading && !categories.length ? (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500">No categories found. Try a different search or add a new category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Featured
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={category.image} alt={category.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            <div className="text-sm text-gray-500">{category.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{category.parentName || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{category.productCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusChange(category.id, category.status)}
                          disabled={actionLoading.id === category.id && actionLoading.type === 'status'}
                          className="relative inline-flex items-center"
                        >
                          <span className={`${category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}>
                            {category.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                          {actionLoading.id === category.id && actionLoading.type === 'status' && (
                            <span className="ml-2">
                              <Loader size="xs" />
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleFeaturedChange(category.id, category.featured)}
                          disabled={actionLoading.id === category.id && actionLoading.type === 'featured'}
                          className="relative inline-flex items-center"
                        >
                          <span className={`${category.featured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}>
                            {category.featured ? 'Featured' : 'Not Featured'}
                          </span>
                          {actionLoading.id === category.id && actionLoading.type === 'featured' && (
                            <span className="ml-2">
                              <Loader size="xs" />
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/categories/edit/${category.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={isDeleting && deleteId === category.id}
                            className="text-red-600 hover:text-red-900"
                          >
                            {isDeleting && deleteId === category.id ? (
                              <Loader size="xs" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to <span className="font-medium">{Math.min(currentPage * 10, totalCategories)}</span> of{' '}
                    <span className="font-medium">{totalCategories}</span> categories
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
              
              <div className="flex sm:hidden justify-between items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesManagement;
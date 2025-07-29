import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  Loader as LoaderIcon
} from 'lucide-react';
import Loader from '../../components/ui/Loader';

// This would be imported from an API utility file in a real app
async function fetchCategory(id) {
  if (id === 'new') {
    return {
      _id: '',
      categoryName: '',
      slug: '',
      description: '',
      image: '',
      parent: '',
      featured: false,
      status: 'active'
    };
  }
  const token = localStorage.getItem('token');
  const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/categories/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch category');
  return await response.json();
}

async function fetchParentCategories() {
  const token = localStorage.getItem('token');
  const response = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/allcategories', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch parent categories');
  const data = await response.json();
  return data.allCategory || [];
}

// Image upload functionality removed as requested

async function saveCategory(categoryData, isNew, id) {
  const token = localStorage.getItem('token');
  const updatedCategoryData = { ...categoryData };
  const url = isNew ? 'https://breakfast-factory-jumia.onrender.com/api/route/categories' : `https://breakfast-factory-jumia.onrender.com/api/route/update-categories/${id}`;
  const method = isNew ? 'POST' : 'PUT';
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedCategoryData),
  });
  if (!response.ok) throw new Error('Failed to save category');
  return await response.json();
}
const CategoryForm = () => {
  const { id = 'new' } = useParams();
  const navigate = useNavigate();
  const isNewCategory = id === 'new';
  
  const [category, setCategory] = useState({
    _id: '',
    categoryName: '',
    slug: '',
    description: '',
    parent: '',
    featured: false,
    status: 'active'
  });
  
  const [parentCategories, setParentCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Load category data and parent categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load category data if editing
        const categoryData = await fetchCategory(id);
        setCategory({
          _id: categoryData._id || '',
          categoryName: categoryData.categoryName || '',
          slug: categoryData.slug || '',
          description: categoryData.description || '',
          parent: categoryData.parent?._id || '',
          featured: categoryData.featured ?? false,
          status: categoryData.status || 'active'
        });
        
        // Load parent categories
        const parents = await fetchParentCategories();
        // Filter out the current category from parent options if editing
        setParentCategories(parents.filter(p => p._id?.toString() !== categoryData._id?.toString()));
      } catch (err) {
        setError('Failed to load category data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Image upload functionality removed as requested
  
  // Generate slug from name
  const generateSlug = () => {
    if (!category.categoryName) return;
    
    const slug = category.categoryName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setCategory(prev => ({ ...prev, slug }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!category.categoryName) {
      setError('Category name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      const result = await saveCategory(category, isNewCategory, category._id);
      if (result.success) {
        setSuccessMessage(result.message);
        setTimeout(() => {
          navigate('/admin/categories');
        }, 2000);
      } else {
        setError(result.message || 'Failed to save category');
      }
    } catch (err) {
      setError('An error occurred while saving the category');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center">
            <Link
              to="/admin/categories"
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {isNewCategory ? 'Add New Category' : 'Edit Category'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isNewCategory ? 'Create a new product category' : 'Update an existing product category'}
          </p>
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
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Category Information</h3>
              <p className="mt-1 text-sm text-gray-500">Basic information about the category</p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                {/* Category Name */}
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Category Name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="categoryName"
                      id="name"
                      value={category.categoryName}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                {/* Category Slug */}
                <div className="sm:col-span-3">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                    Slug
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="slug"
                      id="slug"
                      value={category.slug}
                      onChange={handleChange}
                      className="flex-1 focus:ring-orange-500 focus:border-orange-500 block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Used in URLs. Leave empty to auto-generate from name.</p>
                </div>
                
                {/* Parent Category */}
                <div className="sm:col-span-3">
                  <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
                    Parent Category
                  </label>
                  <div className="mt-1">
                    <select
                      id="parent"
                      name="parent"
                      value={category.parent}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">None (Top Level Category)</option>
                      {parentCategories.map((parent) => (
                        <option key={parent._id} value={parent._id}>
                          {parent.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Optional. Select a parent category if this is a subcategory.</p>
                </div>
                
                {/* Status */}
                <div className="sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      id="status"
                      name="status"
                      value={category.status}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                {/* Description */}
                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={category.description}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Brief description of the category.</p>
                </div>
                
                {/* Featured */}
                <div className="sm:col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="featured"
                        name="featured"
                        type="checkbox"
                        checked={category.featured}
                        onChange={handleChange}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="featured" className="font-medium text-gray-700">Featured Category</label>
                      <p className="text-gray-500">Featured categories are prominently displayed on the homepage and category listings.</p>
                    </div>
                  </div>
                </div>
                
                {/* Category Image section removed as requested */}
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <Link
                to="/admin/categories"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 mr-3"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <LoaderIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {isNewCategory ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>{isNewCategory ? 'Create Category' : 'Save Changes'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
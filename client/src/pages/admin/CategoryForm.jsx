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
const fetchCategory = async (id) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (id === 'new') {
        resolve({
          id: '',
          name: '',
          slug: '',
          description: '',
          image: '',
          parent: '',
          featured: false,
          status: 'active'
        });
      } else {
        resolve({
          id: id,
          name: `Category ${id.replace('cat', '')}`,
          slug: `category-${id.replace('cat', '')}`,
          description: `Description for category ${id.replace('cat', '')}`,
          image: `https://picsum.photos/seed/${id}/200/200`,
          parent: parseInt(id.replace('cat', '')) % 5 === 0 ? '' : `cat${Math.floor(parseInt(id.replace('cat', '')) / 5) * 5 + 1}`,
          featured: parseInt(id.replace('cat', '')) % 7 === 0,
          status: 'active'
        });
      }
    }, 1000);
  });
};

const fetchParentCategories = async () => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const parentCategories = Array.from({ length: 10 }, (_, i) => ({
        id: `cat${i * 5 + 1}`,
        name: [
          'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty & Health', 'Books & Media',
          'Sports & Outdoors', 'Toys & Games', 'Automotive', 'Jewelry & Accessories', 'Baby & Kids'
        ][i]
      }));
      
      resolve(parentCategories);
    }, 800);
  });
};

const saveCategory = async (categoryData) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a slug if not provided
      if (!categoryData.slug && categoryData.name) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      
      resolve({
        success: true,
        message: categoryData.id ? 'Category updated successfully' : 'Category created successfully',
        category: {
          ...categoryData,
          id: categoryData.id || `cat${Math.floor(Math.random() * 1000) + 100}`
        }
      });
    }, 1500);
  });
};

const CategoryForm = () => {
  const { id = 'new' } = useParams();
  const navigate = useNavigate();
  const isNewCategory = id === 'new';
  
  const [category, setCategory] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    image: '',
    parent: '',
    featured: false,
    status: 'active'
  });
  
  const [parentCategories, setParentCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Load category data and parent categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load category data if editing
        const categoryData = await fetchCategory(id);
        setCategory(categoryData);
        setImagePreview(categoryData.image);
        
        // Load parent categories
        const parents = await fetchParentCategories();
        // Filter out the current category from parent options if editing
        setParentCategories(parents.filter(p => p.id !== id));
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
  
  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove image
  const handleRemoveImage = () => {
    setImagePreview('');
    setImageFile(null);
    setCategory(prev => ({ ...prev, image: '' }));
  };
  
  // Generate slug from name
  const generateSlug = () => {
    if (!category.name) return;
    
    const slug = category.name
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
    if (!category.name) {
      setError('Category name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // In a real app, you would upload the image file to a server/cloud storage
      // and get back a URL to store in the category object
      // For this example, we'll just use the preview URL if there's a new file
      const categoryToSave = {
        ...category,
        image: imagePreview || category.image
      };
      
      const result = await saveCategory(categoryToSave);
      
      if (result.success) {
        setSuccessMessage(result.message);
        
        // Redirect after a short delay
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
                      name="name"
                      id="name"
                      value={category.name}
                      onChange={handleChange}
                      onBlur={() => !category.slug && generateSlug()}
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
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
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
                
                {/* Category Image */}
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Category Image</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    {imagePreview ? (
                      <div className="space-y-1 text-center">
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Category preview"
                            className="mx-auto h-32 w-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                          >
                            <span>Change image</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                          >
                            <span>Upload an image</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                      </div>
                    )}
                  </div>
                </div>
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
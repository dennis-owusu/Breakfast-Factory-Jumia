import React, { useState, useEffect } from 'react';
import {Input} from '../../components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select'
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X, Plus, Upload, Loader as LoaderIcon } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { formatPrice } from '../../utils/helpers';
import { outletAPI, categoriesAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Fetch product data from the API
const fetchProduct = async (productId) => {
  try {
    if (productId === 'new') {
      return null;
    }
    
    const response = await outletAPI.getProductById(productId);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};


const saveProduct = async (productData) => {
  try {
    // Log the product data being sent to the API
    console.log('Saving product data:', productData);
    
    let response;
    
    if (productData._id) {
      // Update existing product
      response = await outletAPI.updateProduct(productData._id, productData);
    } else {
      // Create new product
      response = await outletAPI.addProduct(productData);
    }
    
    console.log('API response:', response);
    
    return {
      success: true,
      product: response.data.product
    };
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

const fetchCategories = async () => {
  try {
    // Since there's no categories API endpoint, return hardcoded categories from Product model
    return [
      { _id: 'electronics', name: 'Electronics' },
      { _id: 'clothing', name: 'Clothing' },
      { _id: 'food', name: 'Food' },
      { _id: 'furniture', name: 'Furniture' },
      { _id: 'beauty', name: 'Beauty' },
      { _id: 'health', name: 'Health' },
      { _id: 'sports', name: 'Sports' },
      { _id: 'books', name: 'Books' },
      { _id: 'toys', name: 'Toys' },
      { _id: 'other', name: 'Other' }
    ];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

const ProductForm = () => {
  const { id } = useParams(); // 'new' for new product or product ID for editing
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',  // Changed from name to title to match Product model
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    images: [],
    specifications: [],
    featured: false
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({});
  
  // New specification state
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  
  // Image preview state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  
  // Load product data and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
       
        
        // Load categories
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        
        // If editing an existing product, load its data
        if (id !== 'new') {
          const productData = await fetchProduct(id);
          if (productData) {
            setFormData({
              ...productData,
              price: productData.price.toString(),
              discountPrice: productData.discountPrice ? productData.discountPrice.toString() : '',
              stock: productData.stock.toString()
            });
            setImagePreviewUrls(productData.images);
            
            // Log the loaded product data to help with debugging
            console.log('Loaded product data:', productData);
          }
        }
        
        setError(null);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load data. Please try again later.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Handle number inputs
    if (name === 'price' || name === 'discountPrice' || name === 'stock') {
      // Allow empty string or numbers only
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    // Handle other inputs
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    e.preventDefault();
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Limit to 5 images total
    const totalImages = imageFiles.length + files.length;
    if (totalImages > 5) {
      setError('You can upload a maximum of 5 images.');
      return;
    }
    
    // Create preview URLs
    const newImageFiles = [...imageFiles];
    const newImagePreviewUrls = [...imagePreviewUrls];
    
    files.forEach(file => {
      newImageFiles.push(file);
      newImagePreviewUrls.push(URL.createObjectURL(file));
    });
    
    setImageFiles(newImageFiles);
    setImagePreviewUrls(newImagePreviewUrls);
    
    // In a real app, you would upload these to your server/cloud storage
    // and get back URLs to store in formData.images
    
    // For this demo, we'll just use the preview URLs
    setFormData(prev => ({ ...prev, images: newImagePreviewUrls }));
  };
  
  // Remove image
  const handleRemoveImage = (index) => {
    const newImageFiles = [...imageFiles];
    const newImagePreviewUrls = [...imagePreviewUrls];
    
    // Revoke object URL to avoid memory leaks
    if (newImageFiles[index]) {
      URL.revokeObjectURL(newImagePreviewUrls[index]);
    }
    
    newImageFiles.splice(index, 1);
    newImagePreviewUrls.splice(index, 1);
    
    setImageFiles(newImageFiles);
    setImagePreviewUrls(newImagePreviewUrls);
    setFormData(prev => ({ ...prev, images: newImagePreviewUrls }));
  };
  
  // Handle specification changes
  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setNewSpec(prev => ({ ...prev, [name]: value }));
  };
  
  // Add specification
  const handleAddSpec = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { ...newSpec }]
    }));
    
    // Reset new spec form
    setNewSpec({ key: '', value: '' });
  };
  
  // Remove specification
  const handleRemoveSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Product title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.price) errors.price = 'Price is required';
    if (!formData.stock) errors.stock = 'Stock quantity is required';
    if (!formData.category) errors.category = 'Category is required';
    if (formData.images.length === 0) errors.images = 'At least one image is required';
    
    // Validate price and discount price
    if (formData.price && formData.discountPrice) {
      if (parseInt(formData.discountPrice) >= parseInt(formData.price)) {
        errors.discountPrice = 'Discount price must be less than regular price';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare data for API
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stock: parseInt(formData.stock, 10)
      };
      
      // If editing, include the ID
      if (id !== 'new') {
        productData._id = id;
      }
      
      console.log('Form data before submission:', formData);
      console.log('Prepared product data:', productData);
      
      // Save product
      const result = await saveProduct(productData);
      
      if (result.success) {
        // Show success toast
        toast.success(`Product ${id === 'new' ? 'created' : 'updated'} successfully!`);
        
        // Navigate back to products list
        navigate('/outlet/products');
      } else {
        const errorMessage = 'Failed to save product. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Error details:', err);
      const errorMessage = err.response?.data?.message || 'An error occurred. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
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
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {id === 'new' ? 'Add New Product' : 'Edit Product'}
            </h1>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={() => navigate('/outlet/products')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Product details and information.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Product Title */}
                <div className="sm:col-span-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Product Title *
                  </label>
                  <div className="mt-1">
                    <Input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md ${formErrors.title ? 'border-red-300' : ''}`}
                    />
                    {formErrors.title && (
                      <p className="mt-2 text-sm text-red-600 error-message">{formErrors.title}</p>
                    )}
                  </div>
                </div>
                
                {/* Category */}
                <div className="sm:col-span-2">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <div className="mt-1">
                    <Select
                      onValueChange={(value) => handleChange({target: {name: 'category', value}})}
                      value={formData.category}
                      required
                    >
                      <SelectTrigger className={`w-full ${formErrors.category ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem 
                            key={category._id}
                            value={category._id}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="mt-2 text-sm text-red-600 error-message">{formErrors.category}</p>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md ${formErrors.description ? 'border-red-300' : ''}`}
                    />
                    {formErrors.description && (
                      <p className="mt-2 text-sm text-red-600 error-message">{formErrors.description}</p>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Write a detailed description of your product.
                  </p>
                </div>
                
                {/* Price */}
                <div className="sm:col-span-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price (₦) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₦</span>
                    </div>
                    <Input
                      type="text"
                      name="price"
                      id="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`focus:ring-orange-500 focus:border-orange-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${formErrors.price ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.price && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.price}</p>
                  )}
                </div>
                
                {/* Discount Price */}
                <div className="sm:col-span-2">
                  <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700">
                    Discount Price (₦)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₦</span>
                    </div>
                    <Input
                      type="text"
                      name="discountPrice"
                      id="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleChange}
                      className={`focus:ring-orange-500 focus:border-orange-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${formErrors.discountPrice ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.discountPrice && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.discountPrice}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Leave empty if no discount
                  </p>
                </div>
                
                {/* Stock */}
                <div className="sm:col-span-2">
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                    Stock Quantity *
                  </label>
                  <div className="mt-1">
                    <Input
                      type="text"
                      name="stock"
                      id="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md ${formErrors.stock ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.stock && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.stock}</p>
                  )}
                </div>
                
                {/* Featured */}
                <div className="sm:col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <Input
                        id="featured"
                        name="featured"
                        type="checkbox"
                        checked={formData.featured}
                        onChange={handleChange}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="featured" className="font-medium text-gray-700">Featured Product</label>
                      <p className="text-gray-500">Featured products appear on the homepage.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Images */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Product Images</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Upload up to 5 images of your product.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Images *</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
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
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                        >
                          <span>Upload files</span>
                          <Input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            disabled={imagePreviewUrls.length >= 5}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                  {formErrors.images && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.images}</p>
                  )}
                </div>
                
                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Image Previews</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-w-1 aspect-h-1 rounded-lg bg-gray-100 overflow-hidden">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Product Specifications */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Product Specifications</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Add key specifications for your product.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {/* Add Specification */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label htmlFor="spec-key" className="block text-sm font-medium text-gray-700">
                      Specification
                    </label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="spec-key"
                        name="key"
                        value={newSpec.key}
                        onChange={handleSpecChange}
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g. Brand, Weight"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="spec-value" className="block text-sm font-medium text-gray-700">
                      Value
                    </label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="spec-value"
                        name="value"
                        value={newSpec.value}
                        onChange={handleSpecChange}
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g. Samsung, 500g"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 invisible">
                      Action
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="mt-1 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      disabled={!newSpec.key.trim() || !newSpec.value.trim()}
                    >
                      <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
                
                {/* Specifications List */}
                {formData.specifications.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Added Specifications</h4>
                    <div className="bg-gray-50 rounded-md overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {formData.specifications.map((spec, index) => (
                          <li key={index} className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{spec.key}: </span>
                              <span className="text-sm text-gray-500">{spec.value}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpec(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/outlet/products')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoaderIcon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Product</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
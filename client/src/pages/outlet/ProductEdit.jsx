import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Loader as LoaderIcon, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Loader from '../../components/ui/Loader';



const ProductEdit = () => {
  const { id } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    specifications: [],
    featured: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [currentImage, setCurrentImage] = useState('');

  // Fetch product data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await fetch('/api/route/allcategories', {
          headers: { Authorization: `Bearer ${currentUser?.token}` },
        });
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        const categoryData = Array.isArray(data.allCategory)
          ? data.allCategory.map((cat) => ({
              _id: cat._id,
              name: cat.categoryName,
            }))
          : [];
        setCategories(categoryData);
      } catch (err) {
        console.error('Fetch categories error:', err.message);
        setError('Failed to load categories');
        toast.error('Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/route/product/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const product = await response.json();
        
        // Set form data from product
        setFormData({
          title: product.productName || '',
          description: product.description || '',
          price: product.productPrice?.toString() || '',
          discountPrice: product.discountPrice?.toString() || '',
          stock: product.numberOfProductsAvailable?.toString() || '',
          category: product.category?._id || product.category || '',
          specifications: product.specifications || [],
          featured: product.featured || false
        });
        
        // Set current image
        if (product.productImage) {
          setCurrentImage(product.productImage);
          setImagePreviews([product.productImage]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again.');
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'price' || name === 'discountPrice' || name === 'stock') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (imageFiles.length + files.length > 5) {
      setError('Maximum 5 images allowed.');
      toast.error('Maximum 5 images allowed.');
      return;
    }
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Clear image error when new images are selected
    if (formErrors.images) {
      setFormErrors(prev => ({ ...prev, images: null }));
    }
  };

  const handleRemoveImage = (index) => {
    // If removing the current product image
    if (index === 0 && imagePreviews[0] === currentImage) {
      setCurrentImage('');
    }
    
    const newImageFiles = [...imageFiles];
    const newImagePreviews = [...imagePreviews];
    
    // Only revoke URL if it's a blob URL (not the original image URL)
    if (newImagePreviews[index] && newImagePreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(newImagePreviews[index]);
    }
    
    newImageFiles.splice(index, 1);
    newImagePreviews.splice(index, 1);
    
    setImageFiles(newImageFiles);
    setImagePreviews(newImagePreviews);
    
    if (newImagePreviews.length === 0) {
      setFormErrors(prev => ({ ...prev, images: 'At least one image required' }));
    }
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setNewSpec(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSpec = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) return;
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { ...newSpec }]
    }));
    setNewSpec({ key: '', value: '' });
  };

  const handleRemoveSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Product title is required';
    if (!formData.price) errors.price = 'Price is required';
    if (!formData.stock) errors.stock = 'Stock quantity is required';
    if (!formData.category) errors.category = 'Category is required';
    if (imageFiles.length === 0 && !currentImage) errors.images = 'At least one image must be uploaded';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const formDataToSend = new FormData();
      
      // Append all form data
      formDataToSend.append('productName', formData.title);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('numberOfProductsAvailable', parseInt(formData.stock, 10));
      formDataToSend.append('productPrice', parseFloat(formData.price));
      
      if (formData.discountPrice) {
        formDataToSend.append('discountPrice', parseFloat(formData.discountPrice));
      }
      
      formDataToSend.append('description', formData.description);
      formDataToSend.append('specifications', JSON.stringify(formData.specifications));
      formDataToSend.append('featured', formData.featured);
      
      // Append new image only if one is selected
      if (imageFiles.length > 0) {
        formDataToSend.append('productImage', imageFiles[0]);
      }
      // Do not append anything for productImage if using existing
      const response = await fetch(`/api/route/update/${id}`, {
        method: 'PUT',
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update product');
      }
      
      toast.success('Product updated successfully!');
      navigate(`/outlet/product/${id}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <Button 
              onClick={() => navigate(`/outlet/product/${id}`)} 
              variant="ghost" 
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Edit Product
            </h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Product Title</label>
                  <div className="mt-1">
                    <Input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={formErrors.title ? 'border-red-300' : ''}
                    />
                    {formErrors.title && <p className="mt-2 text-sm text-red-600 error-message">{formErrors.title}</p>}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1">
                    <Select 
                      name="category" 
                      value={formData.category} 
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, category: value }));
                        if (formErrors.category) {
                          setFormErrors(prev => ({ ...prev, category: null }));
                        }
                      }}
                    >
                      <SelectTrigger className={formErrors.category ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="mt-2 text-sm text-red-600 error-message">{formErrors.category}</p>}
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <div className="mt-1">
                    <Textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your product..."
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
                  <div className="mt-1">
                    <Input
                      type="text"
                      name="price"
                      id="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={formErrors.price ? 'border-red-300' : ''}
                    />
                    {formErrors.price && <p className="mt-2 text-sm text-red-600 error-message">{formErrors.price}</p>}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700">Discount Price ($)</label>
                  <div className="mt-1">
                    <Input
                      type="text"
                      name="discountPrice"
                      id="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                  </div>
                </div>



                <div className="sm:col-span-6">
                  <div className="flex items-center">
                    <Checkbox
                      id="featured"
                      name="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({ ...prev, featured: checked }));
                      }}
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                      Feature this product on the homepage
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <div className="h-24 w-24 rounded-md overflow-hidden bg-gray-100">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <div className="h-24 w-24 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <Plus className="h-6 w-6 text-gray-400" />
                        <span className="mt-1 text-xs text-gray-500">Add Image</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}
                </div>
                {formErrors.images && <p className="text-sm text-red-600 error-message">{formErrors.images}</p>}
                <p className="text-sm text-gray-500">Upload up to 5 images. First image will be used as the product thumbnail.</p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Specifications</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label htmlFor="spec-key" className="block text-sm font-medium text-gray-700">Specification</label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        name="key"
                        id="spec-key"
                        value={newSpec.key}
                        onChange={handleSpecChange}
                        placeholder="e.g. Color"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="spec-value" className="block text-sm font-medium text-gray-700">Value</label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        name="value"
                        id="spec-value"
                        value={newSpec.value}
                        onChange={handleSpecChange}
                        placeholder="e.g. Red"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddSpec}
                      disabled={!newSpec.key.trim() || !newSpec.value.trim()}
                      className="w-full"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {formData.specifications.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Added Specifications</h3>
                    <div className="bg-gray-50 rounded-md p-3">
                      <ul className="divide-y divide-gray-200">
                        {formData.specifications.map((spec, index) => (
                          <li key={index} className="py-2 flex justify-between items-center">
                            <div>
                              <span className="font-medium text-gray-900">{spec.key}: </span>
                              <span className="text-gray-700">{spec.value}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpec(index)}
                              className="text-red-500 hover:text-red-700"
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

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => navigate(`/outlet/product/${id}`)}
              variant="outline"
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? (
                <>
                  <LoaderIcon className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEdit;
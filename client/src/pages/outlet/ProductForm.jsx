import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Loader as LoaderIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Textarea } from '../../components/ui/textarea';

const ProductForm = () => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
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
    featured: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentUser) {
        setError('Please log in to add a product');
        toast.error('Please log in to add a product');
        return;
      }
      try {
        setIsLoadingCategories(true);
        const res = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/allcategories', {
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
              image: cat.image,
            }))
          : [];
        console.log('Categories fetched:', categoryData); // Debug
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
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'price' || name === 'discountPrice' || name === 'stock') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
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
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: null }));
    }
  };

  const handleRemoveImage = (index) => {
    const newImageFiles = [...imageFiles];
    const newImagePreviews = [...imagePreviews];
    if (newImagePreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(newImagePreviews[index]);
    }
    newImageFiles.splice(index, 1);
    newImagePreviews.splice(index, 1);
    setImageFiles(newImageFiles);
    setImagePreviews(newImagePreviews);
    if (newImagePreviews.length === 0) {
      setFormErrors((prev) => ({ ...prev, images: 'At least one image required' }));
    }
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setNewSpec((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSpec = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { ...newSpec }],
    }));
    setNewSpec({ key: '', value: '' });
  };

  const handleRemoveSpec = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return null;
    setIsUploadingImages(true);
    const formDataToSend = new FormData();
    imageFiles.forEach((file) => formDataToSend.append('images', file));
    try {
      const response = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser?.token}` },
        body: formDataToSend,
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Image upload failed');
      return data.images[0].filePath; // Return the first image's filePath
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.message);
      toast.error(error.message);
      return null;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Product title is required';
    if (!formData.price) errors.price = 'Price is required';
    if (!formData.stock) errors.stock = 'Stock quantity is required';
    if (!formData.category) errors.category = 'Category is required';
    if (imageFiles.length === 0) errors.images = 'At least one image must be uploaded';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in to add a product');
      toast.error('Please log in to add a product');
      return;
    }
    if (!validateForm()) {
      const firstError = document.querySelector('.error-message');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Please fill all required fields');
      return;
    }
    if (isUploadingImages) return;
    setIsSaving(true);
    setError(null);
    try {
      const imageUrl = await uploadImages();
      if (!imageUrl) {
        setFormErrors((prev) => ({ ...prev, images: 'Image upload failed' }));
        toast.error('Image upload failed');
        return;
      }
      const productData = {
        productName: formData.title,
        category: formData.category, // Use selected category _id
        numberOfProductsAvailable: parseInt(formData.stock, 10),
        productPrice: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        description: formData.description,
        specifications: formData.specifications.map(spec => `${spec.key}: ${spec.value}`), // Convert to array of strings
        featured: formData.featured,
        productImage: imageUrl,
        outlet: currentUser._id || undefined,
      };
      const response = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(productData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create product');
      setFormData({
        title: '',
        description: '',
        price: '',
        discountPrice: '',
        stock: '',
        category: '',
        specifications: [],
        featured: false,
      });
      setImageFiles([]);
      setImagePreviews([]);
      toast.success('Product created successfully!');
      navigate('/outlet/products');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Add New Product
          </h1>
          <button
            type="button"
            onClick={() => navigate('/outlet/products')}
            className="mt-4 md:mt-0 md:ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {isLoadingCategories && (
          <div className="flex justify-center py-4">
            <LoaderIcon className="animate-spin h-6 w-6 text-gray-500" />
          </div>
        )}

        {!isLoadingCategories && categories.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-sm text-yellow-700">No categories available. Please add categories first.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">Product details and information.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Product Title *
                  </label>
                  <Input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`block w-full sm:text-sm border-gray-300 rounded-md ${
                      formErrors.title ? 'border-red-300' : ''
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.title}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, category: value }));
                      if (formErrors.category) {
                        setFormErrors((prev) => ({ ...prev, category: null }));
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full ${formErrors.category ? 'border-red-300' : ''}`}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.category}</p>
                  )}
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description" 
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Write a detailed description of your product"
                    className={`min-h-[100px] ${formErrors.description ? 'border-red-500' : ''}`}
                  />
                  <p className="mt-2 text-sm text-gray-500">Write a detailed description of your product.</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 sm:text-sm">
                      ₦
                    </span>
                    <Input
                      type="text"
                      name="price"
                      id="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                        formErrors.price ? 'border-red-300' : ''
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.price && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.price}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700">
                    Discount Price (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 sm:text-sm">
                      ₦
                    </span>
                    <Input
                      type="text"
                      name="discountPrice"
                      id="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleChange}
                      className={`block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                        formErrors.discountPrice ? 'border-red-300' : ''
                      }`}
                      placeholder="0"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Leave empty if no discount</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                    Stock Quantity *
                  </label>
                  <Input
                    type="text"
                    name="stock"
                    id="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={`block w-full sm:text-sm border-gray-300 rounded-md ${
                      formErrors.stock ? 'border-red-300' : ''
                    }`}
                    placeholder="0"
                  />
                  {formErrors.stock && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.stock}</p>
                  )}
                </div>

                <div className="sm:col-span-6">
                  <div className="flex items-start">
                    <Input
                      id="featured"
                      name="featured"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={handleChange}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                    />
                    <div className="ml-3 text-sm">
                      <label htmlFor="featured" className="font-medium text-gray-700">
                        Featured Product
                      </label>
                      <p className="text-gray-500">Featured products appear on the homepage.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
              <p className="mt-1 text-sm text-gray-500">Upload at least one image of your product (up to 5).</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                    Images * (at least one required)
                  </label>
                  <Input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={isUploadingImages || imagePreviews.length >= 5}
                    className="cursor-pointer"
                  />
                  {formErrors.images && (
                    <p className="mt-2 text-sm text-red-600 error-message">{formErrors.images}</p>
                  )}
                  {isUploadingImages && (
                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                      <LoaderIcon className="animate-spin h-4 w-4 mr-2" />
                      Uploading images...
                    </p>
                  )}
                </div>
                {imagePreviews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Image Previews</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="rounded-lg shadow-md max-w-[150px]"
                            onError={() => toast.error(`Failed to load image ${index + 1}`)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Product Specifications</h3>
              <p className="mt-1 text-sm text-gray-500">Add key specifications for your product.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label htmlFor="spec-key" className="block text-sm font-medium text-gray-700">
                      Specification
                    </label>
                    <Input
                      type="text"
                      id="spec-key"
                      name="key"
                      value={newSpec.key}
                      onChange={handleSpecChange}
                      className="block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g. Brand, Weight"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="spec-value" className="block text-sm font-medium text-gray-700">
                      Value
                    </label>
                    <Input
                      type="text"
                      id="spec-value"
                      name="value"
                      value={newSpec.value}
                      onChange={handleSpecChange}
                      className="block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g. Samsung, 500g"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 invisible">Action</label>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
                      disabled={!newSpec.key.trim() || !newSpec.value.trim()}
                    >
                      <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
                {formData.specifications.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Added Specifications</h4>
                    <div className="bg-gray-50 rounded-md">
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

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/outlet/products')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingImages}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoaderIcon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
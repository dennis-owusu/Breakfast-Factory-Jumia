import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form';

const ProductForm = ({ onSubmit, isLoading, initialData, categories }) => {
  const [imagePreview, setImagePreview] = useState(null);
  
  const form = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || '',
      countInStock: initialData?.countInStock || '',
      category: initialData?.category || '',
      image: '',
    },
  });

  useEffect(() => {
    if (initialData?.image) {
      setImagePreview(initialData.image);
    }
  }, [initialData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      form.setValue('image', file);
    }
  };

  const handleSubmit = (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('countInStock', data.countInStock);
    formData.append('category', data.category);
    
    if (data.image instanceof File) {
      formData.append('image', data.image);
    }
    
    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Product name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          rules={{ required: 'Description is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter product description" 
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            rules={{ 
              required: 'Price is required',
              pattern: {
                value: /^\d+(\.\d{1,2})?$/,
                message: 'Please enter a valid price'
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="countInStock"
            rules={{ 
              required: 'Stock quantity is required',
              pattern: {
                value: /^\d+$/,
                message: 'Please enter a valid number'
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="category"
          rules={{ required: 'Category is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="image"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Product Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    {...field} 
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full h-auto max-h-[200px] rounded-md border border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Upload a high-quality image of your product. Maximum size: 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Add Product'}
        </Button>
      </form>
    </Form>
  );
};

export default ProductForm;
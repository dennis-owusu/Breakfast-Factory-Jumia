import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader } from 'lucide-react';
// Remove import {v4 as uuidv4} from 'uuid'

const OutletCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    featured: false,
    outlet: currentUser._id,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setError('Please log in as an outlet user to create a category');
      toast.error('Please log in as an outlet user');
    } else {
      setFormData((prev) => ({ ...prev, outlet: currentUser._id }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Authentication required');
      toast.error('Authentication required');
      return;
    }
    if (!formData.categoryName.trim()) {
      setError('Category name is required');
      toast.error('Category name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/route/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `HTTP error ${res.status}`);
      }
      if (data.success) {
        toast.success('Category created');
        navigate('/outlet/categories');
      } else {
        setError(data.message || 'Failed to create category');
        toast.error(data.message || 'Failed to create category');
      }
    } catch (err) {
      console.error('Create category error:', err.message);
      setError(err.message || 'Failed to save category');
      toast.error(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  console.log(formData)
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button onClick={() => navigate(-1)} variant="ghost">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h1 className="text-2xl font-bold my-4">{id ? 'Edit Category' : 'Create Category'}</h1>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="categoryName">Name *</Label>
          <Input
            id="categoryName"
            name="categoryName"
            value={formData.categoryName}
            onChange={handleChange}
            required
            className={error.includes('name') ? 'border-red-300' : ''}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            name="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, featured: checked }))}
          />
          <Label htmlFor="featured">Featured</Label>
        </div>
        <Button type="submit" disabled={loading || !currentUser}>
          {loading ? (
            <>
              <Loader className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </form>
    </div>
  );
};

export default OutletCategoryForm;
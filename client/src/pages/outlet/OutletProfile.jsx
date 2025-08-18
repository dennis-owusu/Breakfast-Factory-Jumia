import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { userAPI } from '../../utils/api'; // Assuming you have a user API similar to outletAPI

const OutletProfile = () => {
  const { currentUser } = useSelector((state) => state.user);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  
  // Form setup with react-hook-form
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Ghana',
      profilePicture: null
    }
  });
  
  // Initialize form with user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const response = await userAPI.getMyProfile(); // Assuming API to fetch user profile
          const userData = response.data.data;
          
          // Map API data to form fields
          form.reset({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            street: userData.address?.street || '',
            city: userData.address?.city || '',
            state: userData.address?.state || '',
            postalCode: userData.address?.postalCode || '',
            country: userData.address?.country || 'Ghana'
          });
          
          // Set profile picture preview if available
          if (userData.profilePicture && userData.profilePicture !== 'default-profile.jpg') {
            setProfilePicturePreview(userData.profilePicture);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load profile data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [currentUser, form]);
  
  // Handle file upload for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('profilePicture', file);
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Submit form
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('address[street]', data.street);
      formData.append('address[city]', data.city);
      formData.append('address[state]', data.state);
      formData.append('address[postalCode]', data.postalCode);
      formData.append('address[country]', data.country);
      
      // Add profile picture if changed
      if (data.profilePicture) {
        formData.append('profilePicture', data.profilePicture);
      }
      
      // Send update request
      await userAPI.updateProfile(formData); // Assuming API endpoint for updating profile
      
      setSuccess(true);
      toast.success('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your personal information</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 mt-0.5" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-600 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-green-700 dark:text-green-300">Profile updated successfully!</span>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile" 
                    className="h-32 w-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <label htmlFor="profilePicture" className="mt-4 cursor-pointer">
                <div className="flex items-center text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
                  <Upload className="h-4 w-4 mr-2" />
                  Change Profile Picture
                </div>
                <input
                  id="profilePicture"
                  name="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 2MB</p>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            placeholder="Your full name" 
                            required 
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            className="pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            placeholder="your@email.com" 
                            required 
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel" 
                            className="pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            placeholder="+233 123 456 789" 
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            placeholder="Street address" 
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          placeholder="City" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Region</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          placeholder="State or region" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          placeholder="Postal code" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                          <SelectItem value="Ghana">Ghana</SelectItem>
                          <SelectItem value="Nigeria">Nigeria</SelectItem>
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="South Africa">South Africa</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default OutletProfile;

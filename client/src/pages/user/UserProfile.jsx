import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, MapPin, Lock, Save, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { useForm } from 'react-hook-form';
import { userAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Import API functions from the API utility file
import { userAPI } from '../../utils/api';

// Use the real API functions instead of simulations
const updateUserProfile = async (userData) => {
  try {
    const response = await userAPI.updateProfile(userData);
    return response;
  } catch (error) {
    throw error;
  }
};

const updateUserPassword = async (passwordData) => {
  try {
    const response = await userAPI.updatePassword(passwordData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Address management API functions
const fetchUserAddresses = async () => {
  try {
    const response = await userAPI.getAddresses();
    return response.data;
  } catch (error) {
    throw error;
  }
};

const addUserAddress = async (addressData) => {
  try {
    const response = await userAPI.addAddress(addressData);
    return response;
  } catch (error) {
    throw error;
  }
};

const deleteUserAddress = async (addressId) => {
  try {
    const response = await userAPI.deleteAddress(addressId);
    return response;
  } catch (error) {
    throw error;
  }
};

const setUserDefaultAddress = async (addressId) => {
  try {
    const response = await userAPI.setDefaultAddress(addressId);
    return response;
  } catch (error) {
    throw error;
  }
};

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Initialize react-hook-form for profile
  const profileFormMethods = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Initialize react-hook-form for password
  const passwordFormMethods = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    title: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    isDefault: false
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Initialize react-hook-form for address
  const addressFormMethods = useForm({
    defaultValues: {
      title: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria',
      isDefault: false
    }
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    address: false
  });
  const [success, setSuccess] = useState({
    profile: false,
    password: false,
    address: false
  });
  const [error, setError] = useState({
    profile: null,
    password: null,
    address: null
  });
  
  // Initialize form with user data and fetch addresses
  useEffect(() => {
    if (user) {
      // Set state for backward compatibility
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      
      // Set react-hook-form values
      profileFormMethods.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      
      // Fetch addresses from API
      const fetchAddresses = async () => {
        try {
          const response = await userAPI.getAddresses();
          setAddresses(response.data || []);
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
          toast.error('Failed to load your saved addresses');
        }
      };
      
      fetchAddresses();
    }
  }, [user, profileFormMethods]);
  
  // Handle profile form changes - kept for backward compatibility
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password form changes - kept for backward compatibility
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle address form changes - kept for backward compatibility
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Submit profile form
  const handleProfileSubmit = async (data) => {
    setLoading(prev => ({ ...prev, profile: true }));
    setError(prev => ({ ...prev, profile: null }));
    setSuccess(prev => ({ ...prev, profile: false }));
    
    try {
      // Call the API to update profile
      const response = await userAPI.updateProfile(data);
      
      // Update user in Redux store (in a real app)
      // dispatch(updateUserAction(response.data));
      
      setLoading(prev => ({ ...prev, profile: false }));
      setSuccess(prev => ({ ...prev, profile: true }));
      toast.success('Profile updated successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, profile: false }));
      }, 3000);
    } catch (error) {
      setLoading(prev => ({ ...prev, profile: false }));
      setError(prev => ({ ...prev, profile: error.response?.data?.message || 'Failed to update profile' }));
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };
  
  // Submit password form
  const handlePasswordSubmit = async (data) => {
    setLoading(prev => ({ ...prev, password: true }));
    setError(prev => ({ ...prev, password: null }));
    setSuccess(prev => ({ ...prev, password: false }));
    
    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      setError(prev => ({ ...prev, password: 'New passwords do not match' }));
      setLoading(prev => ({ ...prev, password: false }));
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      // Call the API to update password
      const passwordData = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      };
      
      await userAPI.updatePassword(passwordData);
      
      // Success case
      setLoading(prev => ({ ...prev, password: false }));
      setSuccess(prev => ({ ...prev, password: true }));
      toast.success('Password updated successfully');
      
      // Reset form
      passwordFormMethods.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, password: false }));
      }, 3000);
    } catch (error) {
      setLoading(prev => ({ ...prev, password: false }));
      setError(prev => ({ ...prev, password: error.response?.data?.message || 'Failed to update password' }));
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };
  
  // Submit address form
  const handleAddressSubmit = async (data) => {
    setLoading(prev => ({ ...prev, address: true }));
    setError(prev => ({ ...prev, address: null }));
    
    try {
      // Call the API to add the address
      const response = await userAPI.addAddress(data);
      
      // Refresh addresses from API to ensure we have the latest data
      const addressesResponse = await userAPI.getAddresses();
      setAddresses(addressesResponse.data || []);
      
      // Hide the form
      setShowAddressForm(false);
      
      // Reset form
      addressFormMethods.reset({
        title: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Nigeria',
        isDefault: false
      });
      
      // Show success message
      setSuccess(prev => ({ ...prev, address: true }));
      toast.success('Address added successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, address: false }));
      }, 3000);
    } catch (error) {
      setError(prev => ({ ...prev, address: error.response?.data?.message || 'Failed to add address' }));
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setLoading(prev => ({ ...prev, address: false }));
    }
  };
  
  // Delete address
  const handleDeleteAddress = async (id) => {
    try {
      // Call API to delete address
      await userAPI.deleteAddress(id);
      
      // Refresh addresses from API
      const response = await userAPI.getAddresses();
      setAddresses(response.data || []);
      
      toast.success('Address deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  };
  
  // Set address as default
  const handleSetDefaultAddress = async (id) => {
    try {
      // Call API to set default address
      await userAPI.setDefaultAddress(id);
      
      // Refresh addresses from API
      const response = await userAPI.getAddresses();
      setAddresses(response.data || []);
      
      toast.success('Default address updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update default address');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'security' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'addresses' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Addresses
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Personal Information */}
          {activeTab === 'profile' && (
            <div>
              <Form {...profileFormMethods}>
                <form onSubmit={profileFormMethods.handleSubmit(handleProfileSubmit)}>
                  {error.profile && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <span className="text-red-700">{error.profile}</span>
                    </div>
                  )}
                  
                  {success.profile && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <span className="text-green-700">Profile updated successfully!</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <FormField
                      control={profileFormMethods.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="pl-10" 
                                placeholder="Your full name" 
                                required 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileFormMethods.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                className="pl-10" 
                                placeholder="your.email@example.com" 
                                required 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileFormMethods.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="tel" 
                                className="pl-10" 
                                placeholder="+234 123 456 7890" 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading.profile}
                      className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                    >
                      {loading.profile ? (
                        <>
                          <Loader className="animate-spin h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          
          {/* Security */}
          {activeTab === 'security' && (
            <div>
              <Form {...passwordFormMethods}>
                <form onSubmit={passwordFormMethods.handleSubmit(handlePasswordSubmit)}>
                  {error.password && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <span className="text-red-700">{error.password}</span>
                    </div>
                  )}
                  
                  {success.password && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <span className="text-green-700">Password updated successfully!</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <FormField
                      control={passwordFormMethods.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="pl-10" 
                                placeholder="Enter your current password" 
                                required 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordFormMethods.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="pl-10" 
                                placeholder="Enter new password" 
                                required 
                                minLength={6}
                              />
                            </FormControl>
                          </div>
                          <FormDescription>
                            Password must be at least 6 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordFormMethods.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="pl-10" 
                                placeholder="Confirm new password" 
                                required 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading.password}
                      className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                    >
                      {loading.password ? (
                        <>
                          <Loader className="animate-spin h-4 w-4" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          
          {/* Addresses */}
          {activeTab === 'addresses' && (
            <div>
              {error.address && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <span className="text-red-700">{error.address}</span>
                </div>
              )}
              
              {success.address && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-green-700">Address saved successfully!</span>
                </div>
              )}
              
              {/* Address List */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Addresses</h3>
                  <Button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
                
                {addresses.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No addresses yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Add a new address to save your delivery information</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div 
                        key={address.id} 
                        className={`border rounded-md p-4 relative ${address.isDefault ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}
                      >
                        {address.isDefault && (
                          <span className="absolute top-2 right-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                            Default
                          </span>
                        )}
                        <div className="mb-2">
                          <h4 className="font-medium text-gray-900">{address.title}</h4>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} {address.postalCode}</p>
                          <p>{address.country}</p>
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                          {!address.isDefault && (
                            <Button
                              type="button"
                              variant="link"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-xs text-orange-600 hover:text-orange-800 p-0 h-auto"
                            >
                              Set as Default
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-xs text-red-600 hover:text-red-800 p-0 h-auto"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Add Address Form */}
              {showAddressForm && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h3>
                  <Form {...addressFormMethods}>
                    <form onSubmit={addressFormMethods.handleSubmit(handleAddressSubmit)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={addressFormMethods.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Title *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Home, Work, etc." 
                                  required 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressFormMethods.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="123 Main St" 
                                  required 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressFormMethods.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Lagos" 
                                  required 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressFormMethods.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Lagos State" 
                                  required 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressFormMethods.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal/ZIP Code</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="100001" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressFormMethods.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Nigeria">Nigeria</SelectItem>
                                  <SelectItem value="Ghana">Ghana</SelectItem>
                                  <SelectItem value="Kenya">Kenya</SelectItem>
                                  <SelectItem value="South Africa">South Africa</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center mb-6">
                        <FormField
                          control={addressFormMethods.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                  id="isDefault" 
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel htmlFor="isDefault">
                                  Set as default address
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddressForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading.address}
                          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                        >
                          {loading.address ? (
                            <>
                              <Loader className="animate-spin h-4 w-4 mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Address
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
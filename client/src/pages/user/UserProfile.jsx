import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, MapPin, Lock, Save, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import Loader from '../../components/ui/Loader';

// This would be imported from an API utility file in a real app
const updateUserProfile = async (userData) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data: userData });
    }, 1000);
  });
};

const updateUserPassword = async (passwordData) => {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        reject({ message: 'New passwords do not match' });
        return;
      }
      if (passwordData.newPassword.length < 6) {
        reject({ message: 'Password must be at least 6 characters' });
        return;
      }
      resolve({ success: true });
    }, 1000);
  });
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
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      
      // Simulate fetching addresses
      setAddresses([
        {
          id: '1',
          title: 'Home',
          street: '123 Main Street',
          city: 'Lagos',
          state: 'Lagos State',
          postalCode: '100001',
          country: 'Nigeria',
          isDefault: true
        },
        {
          id: '2',
          title: 'Work',
          street: '456 Office Avenue',
          city: 'Abuja',
          state: 'FCT',
          postalCode: '900001',
          country: 'Nigeria',
          isDefault: false
        }
      ]);
    }
  }, [user]);
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle address form changes
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Submit profile form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, profile: true }));
    setError(prev => ({ ...prev, profile: null }));
    setSuccess(prev => ({ ...prev, profile: false }));
    
    try {
      await updateUserProfile(profileForm);
      setSuccess(prev => ({ ...prev, profile: true }));
      // In a real app, you would dispatch an action to update the Redux store
      // dispatch(updateUserInStore(profileForm));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, profile: false }));
      }, 3000);
    } catch (err) {
      setError(prev => ({ ...prev, profile: err.message || 'Failed to update profile' }));
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };
  
  // Submit password form
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, password: true }));
    setError(prev => ({ ...prev, password: null }));
    setSuccess(prev => ({ ...prev, password: false }));
    
    try {
      await updateUserPassword(passwordForm);
      setSuccess(prev => ({ ...prev, password: true }));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, password: false }));
      }, 3000);
    } catch (err) {
      setError(prev => ({ ...prev, password: err.message || 'Failed to update password' }));
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };
  
  // Submit address form
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, address: true }));
    setError(prev => ({ ...prev, address: null }));
    
    try {
      // Validate form
      if (!newAddress.title || !newAddress.street || !newAddress.city || !newAddress.state) {
        throw new Error('Please fill all required fields');
      }
      
      // Create new address with ID
      const addressToAdd = {
        ...newAddress,
        id: Date.now().toString()
      };
      
      // If this is the default address, update other addresses
      let updatedAddresses = [...addresses];
      if (addressToAdd.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: false
        }));
      }
      
      // Add the new address
      setAddresses([...updatedAddresses, addressToAdd]);
      
      // Reset form
      setNewAddress({
        title: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Nigeria',
        isDefault: false
      });
      
      setShowAddressForm(false);
      setSuccess(prev => ({ ...prev, address: true }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, address: false }));
      }, 3000);
    } catch (err) {
      setError(prev => ({ ...prev, address: err.message || 'Failed to add address' }));
    } finally {
      setLoading(prev => ({ ...prev, address: false }));
    }
  };
  
  // Delete address
  const handleDeleteAddress = (id) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };
  
  // Set address as default
  const handleSetDefaultAddress = (id) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
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
              <form onSubmit={handleProfileSubmit}>
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
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="+234 123 456 7890"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading.profile}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.profile ? (
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
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Security */}
          {activeTab === 'security' && (
            <div>
              <form onSubmit={handlePasswordSubmit}>
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
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading.password}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.password ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
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
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Plus className="-ml-1 mr-1 h-4 w-4" />
                    Add New Address
                  </button>
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
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-xs text-orange-600 hover:text-orange-800"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
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
                  <form onSubmit={handleAddressSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Address Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={newAddress.title}
                          onChange={handleAddressChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="Home, Work, etc."
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="street"
                          value={newAddress.street}
                          onChange={handleAddressChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="123 Main St"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={newAddress.city}
                          onChange={handleAddressChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="Lagos"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province *
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={newAddress.state}
                          onChange={handleAddressChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="Lagos State"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Postal/ZIP Code
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={newAddress.postalCode}
                          onChange={handleAddressChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="100001"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                          Country *
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={newAddress.country}
                          onChange={handleAddressChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          required
                        >
                          <option value="Nigeria">Nigeria</option>
                          <option value="Ghana">Ghana</option>
                          <option value="Kenya">Kenya</option>
                          <option value="South Africa">South Africa</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-6">
                      <input
                        type="checkbox"
                        id="isDefault"
                        name="isDefault"
                        checked={newAddress.isDefault}
                        onChange={handleAddressChange}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                        Set as default address
                      </label>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading.address}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading.address ? (
                          <>
                            <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="-ml-1 mr-2 h-4 w-4" />
                            Save Address
                          </>
                        )}
                      </button>
                    </div>
                  </form>
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
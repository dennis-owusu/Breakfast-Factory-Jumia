import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { outletAPI } from '../../utils/api';


const OutletProfile = () => {
  const { user } = useSelector((state) => state.auth);
  
  // UI state
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState('');
  
  // Form setup with react-hook-form
  const form = useForm({
    defaultValues: {
      outletName: '',
      email: '',
      phone: '',
      logo: null,
      coverImage: null,
      description: '',
      businessType: 'retail',
      registrationNumber: '',
      taxId: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Ghana',
      bankName: '',
      accountName: '',
      accountNumber: '',
      swiftCode: ''
    }
  });
  
  // Initialize form with outlet data
  useEffect(() => {
    const fetchOutletData = async () => {
      if (user) {
        try {
          setLoading(true);
          const response = await outletAPI.getMyOutlet();
          const outletData = response.data.data;
          
          // Map API data to form fields
          form.reset({
            outletName: outletData.name,
            email: outletData.contact?.email || '',
            phone: outletData.contact?.phone || '',
            logo: null, // File objects can't be set directly
            coverImage: null,
            description: outletData.description || '',
            businessType: outletData.businessType || 'retail',
            registrationNumber: outletData.registrationNumber || '',
            taxId: outletData.taxId || '',
            street: outletData.location?.street || '',
            city: outletData.location?.city || '',
            state: outletData.location?.state || '',
            postalCode: outletData.location?.postalCode || '',
            country: outletData.location?.country || 'Ghana',
            bankName: outletData.bankInfo?.bankName || '',
            accountName: outletData.bankInfo?.accountName || '',
            accountNumber: outletData.bankInfo?.accountNumber || '',
            swiftCode: outletData.bankInfo?.swiftCode || ''
          });
          
          // Set image previews if available
          if (outletData.logo && outletData.logo !== 'default-outlet-logo.jpg') {
            setLogoPreview(outletData.logo);
          }
          if (outletData.coverImage) {
            setCoverImagePreview(outletData.coverImage);
          }
        } catch (error) {
          console.error('Error fetching outlet data:', error);
          setError('Failed to load outlet profile data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchOutletData();
  }, [user, form]);
  
  // Handle file uploads
  const handleFileChange = (e, fieldName) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        form.setValue(fieldName, file);
        if (fieldName === 'logo') {
          setLogoPreview(reader.result);
        } else if (fieldName === 'coverImage') {
          setCoverImagePreview(reader.result);
        }
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
      // Prepare outlet data structure
      const outletData = {
        _id: user.outletId, // Assuming user object has outletId
        name: data.outletName,
        contact: {
          email: data.email,
          phone: data.phone
        },
        description: data.description,
        businessType: data.businessType,
        registrationNumber: data.registrationNumber,
        taxId: data.taxId,
        location: {
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country
        },
        bankInfo: {
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          swiftCode: data.swiftCode
        }
      };
      
      // Check if we have file uploads
      if (data.logo || data.coverImage) {
        // Create FormData object for file uploads
        const formData = new FormData();
        
        // Add all fields to FormData
        formData.append('name', data.outletName);
        formData.append('description', data.description);
        formData.append('businessType', data.businessType);
        formData.append('registrationNumber', data.registrationNumber);
        formData.append('taxId', data.taxId);
        
        // Contact info
        formData.append('contact[email]', data.email);
        formData.append('contact[phone]', data.phone);
        
        // Location info
        formData.append('location[street]', data.street);
        formData.append('location[city]', data.city);
        formData.append('location[state]', data.state);
        formData.append('location[postalCode]', data.postalCode);
        formData.append('location[country]', data.country);
        
        // Banking info
        formData.append('bankInfo[bankName]', data.bankName);
        formData.append('bankInfo[accountName]', data.accountName);
        formData.append('bankInfo[accountNumber]', data.accountNumber);
        formData.append('bankInfo[swiftCode]', data.swiftCode);
        
        // Add files to FormData if they exist
        if (data.logo) {
          formData.append('logo', data.logo);
        }
        
        if (data.coverImage) {
          formData.append('coverImage', data.coverImage);
        }
        
        // Send the update request with files
        await outletAPI.updateOutletProfileWithFiles(formData, user.outletId);
      } else {
        // No files to upload, just send the JSON data
        await outletAPI.updateOutletProfile(outletData);
      }
      
      setSuccess(true);
      toast.success('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Outlet Profile</h1>
        <p className="text-gray-600">Manage your outlet information and settings</p>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'basic' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'business' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Business Details
            </button>
            <button
              onClick={() => setActiveTab('banking')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'banking' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Payment Information
            </button>
          </nav>
        </div>
        
        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span className="text-green-700">Profile updated successfully!</span>
            </div>
          )}
          
          {/* Basic Information */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="outletName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outlet Name *</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="pl-10" 
                            placeholder="Your outlet name" 
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
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            className="pl-10" 
                            placeholder="contact@youroutlet.com" 
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
                      <FormLabel>Phone Number *</FormLabel>
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
                            required 
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3} 
                          placeholder="Describe your outlet..." 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormItem>
                    <FormLabel>Outlet Logo</FormLabel>
                    <div className="mt-1 flex items-center">
                      {logoPreview ? (
                        <div className="relative">
                          <img 
                            src={logoPreview} 
                            alt="Outlet Logo" 
                            className="h-32 w-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue('logo', null);
                              setLogoPreview('');
                            }}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <span className="sr-only">Remove</span>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="h-32 w-32 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-5">
                        <label htmlFor="logo" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                          <span>Change</span>
                          <input
                            id="logo"
                            name="logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'logo')}
                            className="sr-only"
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                      </div>
                    </div>
                  </FormItem>
                </div>
                
                <div>
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <div className="mt-1">
                      {coverImagePreview ? (
                        <div className="relative">
                          <img 
                            src={coverImagePreview} 
                            alt="Cover" 
                            className="h-32 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue('coverImage', null);
                              setCoverImagePreview('');
                            }}
                            className="absolute top-0 right-0 mt-2 mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <span className="sr-only">Remove</span>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="coverImage" className="cursor-pointer flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <span className="relative rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                                Upload a file
                                <input
                                  id="coverImage"
                                  name="coverImage"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, 'coverImage')}
                                  className="sr-only"
                                />
                              </span>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </FormItem>
                </div>
              </div>
            </div>
          )}
          
          {/* Business Details */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="wholesale">Wholesale</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="service">Service Provider</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Registration Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="RC-123456" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID / VAT Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="TIN-7890123" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="pl-10"
                              placeholder="123 Business Street" 
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
                            placeholder="Lagos" 
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
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Lagos State" 
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
                        <FormLabel>Postal/ZIP Code</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="100001" 
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nigeria">Nigeria</SelectItem>
                            <SelectItem value="Ghana">Ghana</SelectItem>
                            <SelectItem value="Kenya">Kenya</SelectItem>
                            <SelectItem value="South Africa">South Africa</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Banking Information */}
          {activeTab === 'banking' && (
            <div className="space-y-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Your banking information is used for payouts. Please ensure all details are correct.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="pl-10"
                              placeholder="Bank Name" 
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="pl-10"
                              placeholder="Account Holder Name" 
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="1234567890" 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="swiftCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SWIFT/BIC Code</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="ABCDEFGH" 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
          )}
          
          <div className="mt-6 flex justify-end">
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
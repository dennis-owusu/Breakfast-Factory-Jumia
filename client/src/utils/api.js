import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors (401, 403, etc.)
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Handle unauthorized error (e.g., redirect to login)
        console.error('Unauthorized access');
      } else if (error.response.status === 403) {
        // Handle forbidden error
        console.error('Forbidden access');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/create', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  google: (userData) => api.post('/auth/create/google', userData),
};

// User API endpoints
export const userAPI = {
  // Profile management
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/update', userData),
  updatePassword: (passwordData) => api.put('/auth/password', passwordData),
  
  // Address management
  getAddresses: () => api.get('/auth/addresses'),
  addAddress: (addressData) => api.post('/auth/address', addressData),
  updateAddress: (addressId, addressData) => api.put(`/auth/address/${addressId}`, addressData),
  deleteAddress: (addressId) => api.delete(`/auth/address/${addressId}`),
  setDefaultAddress: (addressId) => api.put(`/auth/address/${addressId}/default`),
};

// Product API endpoints
export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByCategory: (categoryId, params) => api.get(`/products/category/${categoryId}`, { params }),
  searchProducts: (query, params) => api.get('/products/search', { params: { query, ...params } }),
};

// Admin API endpoints
export const adminAPI = {
  // User management
  getAllUsers: (params) => api.get('/auth/users', { params }),
  getUserById: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, userData) => api.put(`/auth/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  
  // Outlet management
  getOutlets: (params) => api.get('/outlets', { params }),
  getOutletById: (id) => api.get(`/outlets/${id}`),
  updateOutlet: (id, outletData) => api.put(`/outlets/${id}`, outletData),
  deleteOutlet: (id) => api.delete(`/outlets/${id}`),
  
  // Product management
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Category management
  getCategories: (params) => api.get('/categories', { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Order management
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
};

// Outlet API endpoints
export const outletAPI = {
  // Outlet profile
  getOutletProfile: () => api.get('/outlet/profile'),
  updateOutletProfile: (profileData) => api.put('/outlet/profile', profileData),
  
  // Outlet products
  getOutletProducts: (params) => api.get('/outlet/products', { params }),
  getOutletProductById: (id) => api.get(`/outlet/products/${id}`),
  createOutletProduct: (productData) => api.post('/outlet/products', productData),
  updateOutletProduct: (id, productData) => api.put(`/outlet/products/${id}`, productData),
  deleteOutletProduct: (id) => api.delete(`/outlet/products/${id}`),
  
  // Outlet orders
  getOutletOrders: (params) => api.get('/outlet/orders', { params }),
  getOutletOrderById: (id) => api.get(`/outlet/orders/${id}`),
  updateOutletOrderStatus: (id, statusData) => api.put(`/outlet/orders/${id}/status`, statusData),
  
  // Outlet analytics
  getOutletAnalytics: () => api.get('/outlet/analytics'),
};

// Cart API endpoints
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productData) => api.post('/cart', productData),
  updateCartItem: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete('/cart'),
};

// Order API endpoints
export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getUserOrders: (params) => api.get('/orders/user', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
};

// Categories API endpoints
export const categoriesAPI = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Export the base API instance for custom calls
export default api;
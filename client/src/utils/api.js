import axios from 'axios';

// Base URL for API requests
const API_URL = '/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/users/me'),
};

// Products API calls
export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: () => api.get('/products/featured'),
  addReview: (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData),
};

// Categories API calls
export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
};

// Cart API calls
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart', { productId, quantity }),
  updateCartItem: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  removeFromCart: (productId) => api.delete(`/cart/${productId}`),
  clearCart: () => api.delete('/cart'),
};

// User API calls
export const userAPI = {
  updateProfile: (userData) => api.put('/users/profile', userData),
  getOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
};

// Outlet API calls
export const outletAPI = {
  getOutletProducts: () => api.get('/outlet/products'),
  addProduct: (productData) => api.post('/outlet/products', productData),
  updateProduct: (productId, productData) => api.put(`/outlet/products/${productId}`, productData),
  deleteProduct: (productId) => api.delete(`/outlet/products/${productId}`),
  getOutletOrders: () => api.get('/outlet/orders'),
  updateOrderStatus: (orderId, status) => api.put(`/outlet/orders/${orderId}`, { status }),
};

// Admin API calls
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getOutlets: () => api.get('/admin/outlets'),
  approveOutlet: (outletId) => api.put(`/admin/outlets/${outletId}/approve`),
  rejectOutlet: (outletId) => api.put(`/admin/outlets/${outletId}/reject`),
  getDashboardStats: () => api.get('/admin/dashboard'),
};

export default api;
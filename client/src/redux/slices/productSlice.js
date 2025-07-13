import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Base URL for API requests
const API_URL = '/api';

// Async thunk for fetching all products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, limit = 12, category, search, minPrice, maxPrice, sort }, { rejectWithValue }) => {
    try {
      // Build query parameters
      let queryParams = `?page=${page}&limit=${limit}`;
      if (category) queryParams += `&category=${category}`;
      if (search) queryParams += `&search=${search}`;
      if (minPrice) queryParams += `&minPrice=${minPrice}`;
      if (maxPrice) queryParams += `&maxPrice=${maxPrice}`;
      if (sort) queryParams += `&sort=${sort}`;
      
      const response = await axios.get(`${API_URL}/products${queryParams}`);
      
      // Check if the response has the expected structure
      if (!response.data.success) {
        return rejectWithValue('Failed to fetch products: Invalid response format');
      }
      
      return {
        products: response.data.products || [],
        totalProducts: response.data.totalProducts || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || page
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

// Async thunk for fetching a single product by ID
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

// Async thunk for fetching featured products
export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/featured`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured products');
    }
  }
);

// Async thunk for fetching product categories
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

// Async thunk for adding a product review
export const addProductReview = createAsyncThunk(
  'products/addProductReview',
  async ({ productId, rating, comment }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      if (!auth.isAuthenticated) {
        return rejectWithValue('You must be logged in to leave a review');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };
      
      const response = await axios.post(
        `${API_URL}/products/${productId}/reviews`,
        { rating, comment },
        config
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add review');
    }
  }
);

const initialState = {
  products: [],
  featuredProducts: [],
  categories: [],
  product: null,
  totalProducts: 0,
  totalPages: 0,
  currentPage: 1,
  isLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    clearProduct: (state) => {
      state.product = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products cases
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.totalProducts = action.payload.totalProducts;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch product by ID cases
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch featured products cases
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredProducts = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add product review cases
      .addCase(addProductReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addProductReview.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.product) {
          state.product = action.payload;
        }
      })
      .addCase(addProductReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductError, clearProduct } = productSlice.actions;
export default productSlice.reducer;
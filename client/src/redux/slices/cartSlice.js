import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const calculateCartTotals = (state) => {
  console.log('calculateCartTotals: state.cart =', state.cart); // Debug log
  // Ensure state.cart is an array, default to empty array if not
  const cartItems = Array.isArray(state.cart) ? state.cart : [];

  const { total, quantity } = cartItems.reduce(
    (cartTotals, cartItem) => {
      // Safeguard for undefined or invalid cartItem
      if (!cartItem || typeof cartItem.price !== 'number' || typeof cartItem.quantity !== 'number') {
        console.warn('Invalid cart item:', cartItem);
        return cartTotals;
      }
      const itemTotal = cartItem.price * cartItem.quantity;
      cartTotals.total += itemTotal;
      cartTotals.quantity += cartItem.quantity;
      return cartTotals;
    },
    { total: 0, quantity: 0 }
  );

  state.total = total;
  state.quantity = quantity;
};

// Example async thunk for fetching cart (adjust to your API)
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart'); // Replace with your API endpoint
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('fetchCart error:', error);
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: [], // Ensure cart is always an array
    total: 0,
    quantity: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    addToCart: (state, action) => {
      console.log('addToCart: payload =', action.payload); // Debug log
      // Ensure payload is valid
      if (action.payload && typeof action.payload._id !== 'undefined') {
        state.cart = Array.isArray(state.cart) ? [...state.cart, action.payload] : [action.payload];
        calculateCartTotals(state);
      } else {
        console.warn('Invalid cart item payload:', action.payload);
      }
    },
    removeFromCart: (state, action) => {
      console.log('removeFromCart: payload =', action.payload); // Debug log
      state.cart = Array.isArray(state.cart)
        ? state.cart.filter((item) => item._id !== action.payload)
        : [];
      calculateCartTotals(state);
    },
    clearCart: (state) => {
      state.cart = [];
      state.total = 0;
      state.quantity = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = Array.isArray(action.payload) ? action.payload : [];
        calculateCartTotals(state);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch cart';
        state.cart = []; // Reset to empty array on error
        calculateCartTotals(state);
      });
  },
});

export const { clearCartError, updateCartItem, removeCartItem, addToCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
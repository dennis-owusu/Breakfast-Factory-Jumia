import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: [],
    totalPrice: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const itemInCart = state.cart.find(
        (item) => item._id === action.payload._id
      );

      if (itemInCart) {
        // If item exists, increment the quantity and update the price
        itemInCart.quantity++;
        itemInCart.productPrice = Number(itemInCart.productPrice); // Ensure price is a number
        state.totalPrice += itemInCart.productPrice; // Update total price
      } else {
        // If item does not exist, add it to the cart
        const newItem = {
          ...action.payload,
          quantity: 1,
          productPrice: Number(action.payload.productPrice), // Ensure price is a number
        };
        state.cart.push(newItem);
        state.totalPrice += newItem.productPrice; // Update total price
      }
    },
    incrementQuantity: (state, action) => {
      const item = state.cart.find((item) => item._id === action.payload);
      if (item) {
        item.quantity++;
        state.totalPrice += item.productPrice; //
      }
    },
    decrementQuantity: (state, action) => {
      const item = state.cart.find((item) => item._id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity--;
        state.totalPrice -= item.productPrice;
      }
    },
    removeItem: (state, action) => {
      const itemToRemove = state.cart.find((item) => item._id === action.payload);
      if (itemToRemove) {
        state.totalPrice -= itemToRemove.productPrice * itemToRemove.quantity; 
        state.cart = state.cart.filter((item) => item._id !== action.payload);
      }
    },
    resetCart: (state) => {
      state.cart = [];
      state.totalPrice = 0;
    },
    clearCart: (state) => {
      state.cart = [];
      state.totalPrice = 0;
    },
  },
});

export const cartReducer = cartSlice.reducer;
export const {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeItem,
  resetCart,
  clearCart,
} = cartSlice.actions;
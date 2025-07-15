import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: [],
    totalPrice: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const { _id, ...product } = action.payload;
      const itemInCart = state.cart.find((item) => item.product._id === _id);
      const price = Number(product.discountPrice || product.productPrice || product.price);

      if (itemInCart) {
        if (itemInCart.quantity < 10) {
          itemInCart.quantity++;
          state.totalPrice += price;
        }
      } else {
        const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        state.cart.push({
          _id: cartItemId,
          product: { _id, ...product },
          quantity: 1,
        });
        state.totalPrice += price;
      }
    },
    incrementQuantity: (state, action) => {
      const item = state.cart.find((item) => item._id === action.payload);
      if (item && item.quantity < 10) {
        item.quantity++;
        const price = Number(item.product.discountPrice || item.product.productPrice || item.product.price);
        state.totalPrice += price;
      }
    },
    decrementQuantity: (state, action) => {
      const item = state.cart.find((item) => item._id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity--;
        const price = Number(item.product.discountPrice || item.product.productPrice || item.product.price);
        state.totalPrice -= price;
      }
    },
    removeItem: (state, action) => {
      const item = state.cart.find((item) => item._id === action.payload);
      if (item) {
        const price = Number(item.product.discountPrice || item.product.productPrice || item.product.price);
        state.totalPrice -= price * item.quantity;
        state.cart = state.cart.filter((item) => item._id !== action.payload);
      }
    },
    clearCart: (state) => {
      state.cart = [];
      state.totalPrice = 0;
    },
  },
});

export const { addToCart, incrementQuantity, decrementQuantity, removeItem, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
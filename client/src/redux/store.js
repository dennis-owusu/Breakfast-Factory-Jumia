import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from './slices/authSlice';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { cartReducer } from './slices/cartSlice';
import restockReducer from './slices/restockSlice';

const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  restock: restockReducer
});

const persistConfig = {
  key: 'root',
  storage,
  version: 1,
  blacklist: import.meta.env.MODE === 'production' ? ['sensitiveReducer'] : [], // blacklist sensitive data
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
  devTools: import.meta.env.MODE === 'development', // Enable only in development
});

export const persistor = persistStore(store);
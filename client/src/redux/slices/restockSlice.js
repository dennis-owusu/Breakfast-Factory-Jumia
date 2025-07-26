import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const createRestockRequest = createAsyncThunk(
  'restock/createRequest',
  async ({ productId, requestedQuantity, reason }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/route/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, requestedQuantity, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOutletRestockRequests = createAsyncThunk(
  'restock/fetchOutletRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/route/outlet-requests');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.requests;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const restockSlice = createSlice({
  name: 'restock',
  initialState: {
    requests: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create restock request
      .addCase(createRestockRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRestockRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.requests.unshift(action.payload.request);
      })
      .addCase(createRestockRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch outlet restock requests
      .addCase(fetchOutletRestockRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOutletRestockRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchOutletRestockRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = restockSlice.actions;
export default restockSlice.reducer;
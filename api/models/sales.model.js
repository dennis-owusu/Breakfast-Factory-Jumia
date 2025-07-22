import mongoose from 'mongoose';

const salesSchema = new mongoose.Schema({
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  product: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    images: { type: [String], default: [] },
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  total: {
    type: Number,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  soldAt: {
    type: Date,
    default: Date.now,
  },
});

const Sales = mongoose.model('Sales', salesSchema);

export default Sales;
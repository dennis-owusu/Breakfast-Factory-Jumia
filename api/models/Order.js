import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be a positive number']
  }
});

const ShippingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide full name']
  },
  address: {
    type: String,
    required: [true, 'Please provide address']
  },
  city: {
    type: String,
    required: [true, 'Please provide city']
  },
  state: {
    type: String,
    required: [true, 'Please provide state']
  },
  postalCode: {
    type: String
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number']
  }
});

const PaymentSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['paystack', 'cash_on_delivery'],
    default: 'cash_on_delivery'
  },
  reference: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  paidAt: {
    type: Date
  }
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [OrderItemSchema],
  shipping: ShippingSchema,
  payment: PaymentSchema,
  itemsPrice: {
    type: Number,
    required: true,
    min: [0, 'Items price must be a positive number']
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price must be a positive number']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderNumber: {
    type: String,
    unique: true
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Generate a unique order number with prefix ORD and current timestamp
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  next();
});

export default mongoose.model('Order', OrderSchema);
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users', 
    required: true 
  },
  plan: { 
    type: String, 
    enum: ['free', 'pro'], 
    default: 'free', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'], 
    default: 'active', 
    required: true 
  },
  startDate: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  autoRenew: { 
    type: Boolean, 
    default: false 
  },
  paymentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment' 
  },
  features: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'GHS'
  }
}, {
  timestamps: true
});

// Create a TTL index on endDate to automatically expire documents
subscriptionSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
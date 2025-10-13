import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users', 
    required: false 
  },
  plan: { 
    type: String, 
    enum: ['free', 'monthly', 'bimonthly', 'pro'], 
    default: 'free', 
    required: false 
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
  },
  history: [{
    action: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Remove TTL index to prevent automatic deletion
// subscriptionSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
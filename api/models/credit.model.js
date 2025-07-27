import mongoose from 'mongoose';

const creditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'overdue'],
    default: 'pending'
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      required: true
    },
    reference: {
      type: String
    }
  }],
  notes: {
    type: String
  },
  remainingAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Create index for efficient queries
creditSchema.index({ user: 1, outlet: 1, status: 1 });
creditSchema.index({ dueDate: 1, status: 1 });

const Credit = mongoose.model('Credit', creditSchema);

export default Credit;
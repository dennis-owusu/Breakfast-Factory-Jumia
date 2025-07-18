import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  referenceId: { type: String, required: true, unique: true },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }, // Assuming outlets are users with role 'outlet'
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'GHS' },
  payerEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  referenceId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }, // Assuming outlets are users with role 'outlet'
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
  amount: { type: Number, required: true },
  phoneNumber: {type: Number, required: false},
  currency: { type: String, default: 'GHS' },
  paymentMethod: { type: String, required: true },
  payerEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
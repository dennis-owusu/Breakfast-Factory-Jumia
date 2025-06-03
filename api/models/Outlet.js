import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an outlet name'],
    trim: true,
    maxlength: [100, 'Outlet name cannot be more than 100 characters']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: [true, 'Please provide a location']
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number']
    },
    email: {
      type: String,
      required: [true, 'Please provide a contact email']
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String,
    default: 'default-outlet-logo.jpg'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Cascade delete products when an outlet is deleted
OutletSchema.pre('remove', async function(next) {
  await this.model('Product').deleteMany({ outletId: this._id });
  next();
});

export default mongoose.model('Outlet', OutletSchema);
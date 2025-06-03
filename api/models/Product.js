import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a product title'],
    trim: true,
    maxlength: [100, 'Product title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price must be a positive number']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price must be a positive number']
  },
  stock: {
    type: Number,
    required: [true, 'Please provide product stock'],
    min: [0, 'Stock must be a positive number'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    enum: [
      'Electronics',
      'Clothing',
      'Food',
      'Furniture',
      'Beauty',
      'Health',
      'Sports',
      'Books',
      'Toys',
      'Other'
    ]
  },
  images: [
    {
      type: String,
      required: [true, 'Please provide at least one product image']
    }
  ],
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  featured: {
    type: Boolean,
    default: false
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  }
}, {
  timestamps: true
});

// Calculate average rating when reviews are modified
ProductSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating = totalRating / this.reviews.length;
  this.numReviews = this.reviews.length;
};

export default mongoose.model('Product', ProductSchema);
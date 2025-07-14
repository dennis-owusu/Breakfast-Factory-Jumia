import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true, // Ensure this field is required
  },
  filePath: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.model('Image', imageSchema);

export default Image;
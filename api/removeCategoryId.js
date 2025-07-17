import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Categories from './models/categories.model.js';

dotenv.config();

async function removeCategoryId() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Categories.updateMany(
      { categoryId: { $exists: true } },
      { $unset: { categoryId: '' } }
    );
    console.log(`Updated ${result.modifiedCount} documents`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeCategoryId();
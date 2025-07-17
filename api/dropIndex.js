import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Categories from './models/categories.model.js';

dotenv.config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Categories.collection.dropIndex('categoryId_1');
    console.log('Index dropped successfully');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndex();
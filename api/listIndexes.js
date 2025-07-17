import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Categories from './models/categories.model.js';

dotenv.config();

async function listIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const indexes = await Categories.collection.getIndexes({ full: true });
    console.log('Current indexes:', indexes);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listIndexes();
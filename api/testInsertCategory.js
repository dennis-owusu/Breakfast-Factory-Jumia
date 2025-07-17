import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Categories from './models/categories.model.js';

dotenv.config();

async function testInsert() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const testCategory = new Categories({
      categoryName: 'Test Category',
      description: 'This is a test',
      outlet: '000000000000000000000000', // Replace with a valid ObjectId
      featured: false
    });
    await testCategory.save();
    console.log('Test category inserted successfully');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testInsert();
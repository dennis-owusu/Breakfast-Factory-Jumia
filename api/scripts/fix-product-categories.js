import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Categories from '../models/categories.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixProductCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find();

    for (const product of products) {
      if (typeof product.category === 'string') {
        const categoryString = product.category;
        const category = await Categories.findOne({ categoryName: { $regex: new RegExp('^' + categoryString + '$', 'i') } });

        if (category) {
          product.category = category._id;
          await product.save();
          console.log(`Updated product ${product._id}: category from '${categoryString}' to ObjectId ${category._id}`);
        } else {
          console.warn(`No matching category found for '${categoryString}' in product ${product._id}`);
        }
      }
    }

    console.log('All products updated successfully');
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixProductCategories();
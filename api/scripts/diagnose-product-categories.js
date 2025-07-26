import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Categories from '../models/categories.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function diagnoseProductCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find().select('productName category');
    const categories = await Categories.find().select('_id categoryName');

    console.log('Existing Categories:');
    categories.forEach(cat => {
      console.log(`ID: ${cat._id}, Name: ${cat.categoryName}`);
    });

    console.log('\nProducts:');
    for (const product of products) {
      const categoryType = typeof product.category;
      const categoryValue = product.category ? product.category.toString() : 'null';
      const matchingCategory = product.category && mongoose.Types.ObjectId.isValid(product.category)
        ? categories.find(cat => cat._id.equals(product.category))
        : categories.find(cat => cat.categoryName.toLowerCase() === categoryValue.toLowerCase());

      console.log(`Product: ${product.productName}`);
      console.log(`  Category Type: ${categoryType}`);
      console.log(`  Category Value: ${categoryValue}`);
      console.log(`  Matching Category: ${matchingCategory ? matchingCategory.categoryName : 'None'}`);
    }

    console.log('Diagnosis complete');
  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    mongoose.connection.close();
  }
}

diagnoseProductCategories();
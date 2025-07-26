import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixAllOrderIssues() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Fix order dates to be in the recent past (not future)
    const orders = await Order.find().sort({ createdAt: 1 });
    console.log(`Found ${orders.length} orders to process`);

    if (orders.length === 0) {
      console.log('No orders found');
      return;
    }

    // Set dates to recent past (last 30 days) - explicitly use 2024 as the year
    const currentYear = 2024; // Hardcode current year
    const now = new Date();
    now.setFullYear(currentYear); // Force current year
    
    const dates = [
      new Date(currentYear, now.getMonth() - 1, now.getDate() - 20), // ~30 days ago
      new Date(currentYear, now.getMonth(), now.getDate() - 10),      // ~10 days ago
      new Date(currentYear, now.getMonth(), now.getDate() - 2)        // 2 days ago
    ];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const newDate = i < dates.length ? dates[i] : dates[dates.length - 1];
      console.log(`Original date: ${order.createdAt}, New date: ${newDate.toISOString()}`);
      order.createdAt = newDate;
      order.updatedAt = newDate;
      console.log(`Setting order ${order._id} date to ${newDate.toISOString()}`);
    }

    // 2. Fix product references in orders
    for (const order of orders) {
      let updated = false;
      const updatedProducts = await Promise.all(
        order.products.map(async (item) => {
          const embedded = item.product;
          
          // Find matching product by name
          const product = await Product.findOne({ productName: embedded.name });
            
          if (product) {
            updated = true;
            return {
              ...item,
              product: {
                id: product._id,
                name: product.productName,
                price: product.productPrice,
                images: product.productImage ? [product.productImage] : [],
                category: product.category,
                outlet: product.outlet
              }
            };
          } else {
            console.warn(`No matching product found for ${embedded.name} in order ${order._id}`);
            return item;
          }
        })
      );
      
      if (updated) {
        order.products = updatedProducts;
        console.log(`Updated product references in order ${order._id}`);
      }
      
      // Save the order with both date and product fixes
      await order.save();
      console.log(`Saved order ${order._id}`);
    }

    console.log('All order issues fixed successfully');
  } catch (error) {
    console.error('Error fixing order issues:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAllOrderIssues();
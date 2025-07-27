import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamically import the Order model
const orderModelPath = join(__dirname, 'models', 'order.model.js');
const orderModelContent = fs.readFileSync(orderModelPath, 'utf8');

// Extract the schema definition to understand the structure
console.log('Order Model Structure:');
console.log(orderModelContent);

// Connect to MongoDB and find a sample order
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      // Dynamically import the Order model
      const { default: Order } = await import('./models/order.model.js');
      
      // Find one order
      const order = await Order.findOne().lean();
      console.log('\nSample Order:');
      console.log(JSON.stringify(order, null, 2));
      
      // Find one order with populated products
      const populatedOrder = await Order.findOne().populate('products.product').lean();
      console.log('\nSample Order with Populated Products:');
      console.log(JSON.stringify(populatedOrder, null, 2));
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      await mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
  });
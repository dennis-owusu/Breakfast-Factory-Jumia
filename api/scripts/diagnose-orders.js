import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function diagnoseOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find().sort({ createdAt: -1 });

    console.log('All Orders:');
    for (const order of orders) {
      console.log(`\nOrder ID: ${order._id}`);
      console.log(`Created At: ${order.createdAt}`);
      console.log(`Total Price: ${order.totalPrice}`);
      console.log('Products:');
      for (const item of order.products) {
        const prod = item.product;
        console.log(`  - Name: ${prod.name}, Quantity: ${item.quantity}, Price: ${prod.price}`);
        console.log(`    ID: ${prod.id || 'Missing'}, Category: ${prod.category ? prod.category.toString() : 'Missing'}`);
      }
    }

    console.log('\nDiagnosis complete');
  } catch (error) {
    console.error('Error diagnosing orders:', error);
  } finally {
    mongoose.connection.close();
  }
}

diagnoseOrders();
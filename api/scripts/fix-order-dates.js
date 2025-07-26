import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixOrderDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find().sort({ createdAt: 1 });

    if (orders.length === 0) {
      console.log('No orders found');
      return;
    }

    const now = new Date();
    const daysAgo = orders.length > 1 ? Math.floor((now - new Date(orders[0].createdAt)) / (1000 * 60 * 60 * 24)) : 0;
    let currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() - daysAgo);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      order.createdAt = new Date(currentDate);
      await order.save();
      console.log(`Updated order ${order._id} createdAt to ${order.createdAt}`);
      currentDate.setDate(currentDate.getDate() + 1); // Increment by 1 day for each subsequent order
    }

    console.log('All order dates updated successfully');
  } catch (error) {
    console.error('Error updating order dates:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixOrderDates();
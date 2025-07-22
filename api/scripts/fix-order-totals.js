import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import dotenv from 'dotenv';
dotenv.config();

dotenv.config();

async function fixOrderTotals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find();

    for (const order of orders) {
      let calculatedTotal = 0;

      for (const item of order.products) {
        // Assuming products are embedded with product object containing price
        if (item.product && item.product.price) {
          calculatedTotal += item.product.price * item.quantity;
        } else {
          console.warn(`Missing product or price for item in order ${order._id}`);
        }
      }

      if (order.totalPrice !== calculatedTotal) {
        order.totalPrice = calculatedTotal;
        await order.save();
        console.log(`Updated order ${order._id} total from ${order.totalPrice} to ${calculatedTotal}`);
      }
    }

    console.log('All orders updated successfully');
  } catch (error) {
    console.error('Error updating orders:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixOrderTotals();
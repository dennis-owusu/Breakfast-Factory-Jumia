import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixOrderProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find();

    for (const order of orders) {
      let updated = false;
      const updatedProducts = await Promise.all(
        order.products.map(async (item) => {
          const embedded = item.product;
          if (embedded.id && embedded.category) {
            return item; // Already fixed
          }
          // Find matching product
          const query = {
            productName: embedded.name,
            productPrice: embedded.price
          };
          if (embedded.outlet) {
            try {
              query.outlet = typeof embedded.outlet === 'string' ? new mongoose.Types.ObjectId(embedded.outlet) : embedded.outlet;
            } catch (e) {
              console.warn(`Invalid outlet ID for product ${embedded.name} in order ${order._id}`);
            }
          }
          console.log(`Querying for product: ${embedded.name}, price: ${embedded.price}, outlet: ${query.outlet}`);
          const product = await Product.findOne(query);
          if (product) {
            updated = true;
            return {
              ...item,
              product: {
                ...embedded,
                id: product._id,
                category: product.category
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
        await order.save();
        console.log(`Updated order ${order._id}`);
      }
    }

    console.log('All orders updated successfully');
  } catch (error) {
    console.error('Error updating orders:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixOrderProducts();
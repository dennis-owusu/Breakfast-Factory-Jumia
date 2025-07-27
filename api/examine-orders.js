import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB and examine orders
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      // Dynamically import the Order model
      const { default: Order } = await import('./models/order.model.js');
      
      // Find orders
      const orders = await Order.find().limit(3).lean();
      
      if (orders.length === 0) {
        console.log('No orders found in the database');
        return;
      }
      
      // Examine the first order's structure
      const firstOrder = orders[0];
      console.log('Order Structure:');
      console.log('- _id:', firstOrder._id);
      console.log('- user:', firstOrder.user);
      console.log('- userInfo:', firstOrder.userInfo);
      console.log('- totalPrice:', firstOrder.totalPrice);
      console.log('- address:', firstOrder.address);
      console.log('- status:', firstOrder.status);
      console.log('- createdAt:', firstOrder.createdAt);
      
      // Examine products structure
      console.log('\nProducts Structure:');
      if (firstOrder.products && firstOrder.products.length > 0) {
        const firstProduct = firstOrder.products[0];
        console.log('Product item structure:', JSON.stringify(firstProduct, null, 2));
        
        // Check if product has outlet information
        if (firstProduct.product) {
          console.log('\nProduct has the following fields:');
          Object.keys(firstProduct.product).forEach(key => {
            console.log(`- ${key}: ${JSON.stringify(firstProduct.product[key])}`);
          });
        }
      } else {
        console.log('No products in this order');
      }
      
      // Now let's try to find orders with populated product references
      console.log('\nAttempting to find orders with product references...');
      const ordersWithProductRefs = await Order.find({
        'products.product': { $type: 'objectId' }
      }).limit(3).lean();
      
      if (ordersWithProductRefs.length > 0) {
        console.log(`Found ${ordersWithProductRefs.length} orders with product references`);
        console.log('First order with product references:', JSON.stringify(ordersWithProductRefs[0], null, 2));
      } else {
        console.log('No orders with product references found');
      }
      
    } catch (err) {
      console.error('Error examining orders:', err);
    } finally {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
  });
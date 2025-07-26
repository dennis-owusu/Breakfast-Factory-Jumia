import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Categories from '../models/categories.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function diagnoseAnalytics() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all orders
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`Found ${orders.length} orders`);

    // Create a map to count product quantities
    const productCounts = {};
    const productSales = {};

    // Process each order
    for (const order of orders) {
      console.log(`\nOrder ${order._id} - Created: ${order.createdAt}`);
      
      // Process each product in the order
      for (const item of order.products) {
        const productName = item.product.name;
        const productId = item.product.id;
        const quantity = item.quantity;
        const price = item.product.price;
        const totalValue = quantity * price;
        
        console.log(`  Product: ${productName}`);
        console.log(`    ID: ${productId || 'Missing'}`);
        console.log(`    Quantity: ${quantity}`);
        console.log(`    Price: ${price}`);
        console.log(`    Total Value: ${totalValue}`);
        
        // Add to product counts
        if (!productCounts[productName]) {
          productCounts[productName] = 0;
        }
        productCounts[productName] += quantity;
        
        // Add to product sales
        if (!productSales[productName]) {
          productSales[productName] = 0;
        }
        productSales[productName] += totalValue;
      }
    }

    // Display product counts
    console.log('\n--- Product Quantities ---');
    const sortedProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1]); // Sort by quantity in descending order
    
    for (const [name, count] of sortedProducts) {
      console.log(`${name}: ${count} units, $${productSales[name].toFixed(2)} sales`);
    }

    // Now run a test aggregation similar to the analytics controller
    console.log('\n--- Test Aggregation Results ---');
    const topProducts = await Order.aggregate([
      { $unwind: '$products' },
      // Group by product name first to ensure we're counting units correctly
      {
        $group: {
          _id: '$products.product.name',  // Group by product name
          productId: { $first: '$products.product.id' }, // Take the first product ID
          price: { $first: '$products.product.price' }, // Take the first price
          sales: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } },
          units: { $sum: '$products.quantity' }, // Sum quantities for this product name
        }
      },
      // Now lookup product details for additional info
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
      // Final projection with all needed fields
      {
        $project: {
          id: { $ifNull: ['$productDetails._id', '$productId'] },
          name: { $ifNull: ['$productDetails.productName', '$_id'] }, // Use original product name if lookup fails
          category: { $ifNull: ['$categoryDetails.categoryName', 'Uncategorized'] },
          sales: 1,
          units: 1,
          _id: 0,
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
    ]);
    
    console.log('Top Products from Aggregation:');
    console.log(JSON.stringify(topProducts, null, 2));

  } catch (error) {
    console.error('Error diagnosing analytics:', error);
  } finally {
    mongoose.connection.close();
  }
}

diagnoseAnalytics();
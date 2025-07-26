const mongoose = require('mongoose');
const Order = require('./models/order.model');
const Product = require('./models/product.model');
const Category = require('./models/category.model');

async function diagnoseAnalytics() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders`);

    // Manual count
    const productCounts = {};
    let totalSales = 0;
    orders.forEach(order => {
      order.products.forEach(item => {
        const name = item.product.name;
        const qty = item.quantity;
        const sales = item.product.price * qty;
        if (!productCounts[name]) {
          productCounts[name] = { units: 0, sales: 0 };
        }
        productCounts[name].units += qty;
        productCounts[name].sales += sales;
        totalSales += sales;
      });
    });

    console.log('Manual Product Counts:');
    Object.entries(productCounts).forEach(([name, data]) => {
      console.log(`${name}: ${data.units} units, ${data.sales} sales`);
    });

    // Test aggregation similar to controller
    const topProducts = await Order.aggregate([
      { $unwind: '$products' },
      { $group: {
        _id: '$products.product.name',
        units: { $sum: '$products.quantity' },
        sales: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } }
      } },
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'productName',
        as: 'productDetails'
      } },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      { $lookup: {
        from: 'categories',
        localField: 'productDetails.category',
        foreignField: '_id',
        as: 'categoryDetails'
      } },
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
      { $project: {
        id: { $ifNull: ['$productDetails._id', null] },
        name: '$_id',
        category: '$categoryDetails.categoryName',
        sales: 1,
        units: 1
      } },
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    console.log('Aggregated Top Products:');
    topProducts.forEach(p => {
      console.log(`${p.name}: ${p.units} units, ${p.sales} sales, Category: ${p.category || 'N/A'}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnoseAnalytics();
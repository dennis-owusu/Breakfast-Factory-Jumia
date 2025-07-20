 import Order from '../models/order.model.js';
import Users from '../models/users.model.js';
import Product from '../models/product.model.js';
import Analytics from '../models/analytics.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Total Sales (sum of totalPrice from delivered orders)
    const totalSalesData = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalSales = totalSalesData[0]?.total || 0;

    // Total Orders
    const totalOrders = await Order.countDocuments();

    // Total Users
    const totalUsers = await Users.countDocuments();

    // Total Outlets (users with usersRole: 'outlet')
    const totalOutlets = await Users.countDocuments({ usersRole: 'outlet' });

    // Total Products
    const totalProducts = await Product.countDocuments();

    // Pending Orders
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Pending Outlets (assuming outlets without storeName are pending)
    const pendingOutlets = await Users.countDocuments({ 
      usersRole: 'outlet', 
      storeName: { $in: [null, ''] } 
    });

    // Recent Orders (last 5 orders, sorted by createdAt descending)
    const recentOrders = await Order.find()
      .select('orderNumber userInfo totalPrice status createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .then(orders => orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: { name: order.userInfo.name || 'Unknown' },
        totalAmount: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt
      })));

    // New Outlets (last 3 users with usersRole: 'outlet', sorted by createdAt descending)
    const newOutlets = await Users.find({ usersRole: 'outlet' })
      .select('name storeName createdAt')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()
      .then(outlets => outlets.map(outlet => ({
        _id: outlet._id,
        name: outlet.storeName || 'Pending Outlet',
        owner: { name: outlet.name },
        status: outlet.storeName ? 'active' : 'pending',
        productsCount: 0, // Will update if product count is needed
        createdAt: outlet.createdAt
      })));

    // Update productsCount for newOutlets
    for (let outlet of newOutlets) {
      const count = await Product.countDocuments({ outlet: outlet._id });
      outlet.productsCount = count;
    }

    // Sales by Category (sum of totalPrice for delivered orders grouped by category)
    const salesByCategoryData = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$products' },
      { $lookup: {
          from: 'products',
          localField: 'products.product._id',
          foreignField: '_id',
          as: 'productDetails'
      }},
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      { $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'category'
      }},
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: '$category.name',
          value: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } }
      }},
      { $match: { _id: { $ne: null } } }, // Exclude orders without a category
      { $project: {
          name: '$_id',
          value: 1,
          _id: 0
      }},
      { $sort: { value: -1 } }
    ]);

    // Fallback sales by category if no data
    const salesByCategory = salesByCategoryData.length > 0 ? salesByCategoryData : [
      { name: 'Electronics', value: 0 },
      { name: 'Fashion', value: 0 },
      { name: 'Home & Kitchen', value: 0 },
      { name: 'Beauty & Personal Care', value: 0 },
      { name: 'Books & Media', value: 0 }
    ];

    const stats = {
      totalSales,
      totalOrders,
      totalUsers,
      totalOutlets,
      totalProducts,
      pendingOrders,
      pendingOutlets,
      recentOrders,
      newOutlets,
      salesByCategory
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard statistics',
      error: error.message
    });
  }
};
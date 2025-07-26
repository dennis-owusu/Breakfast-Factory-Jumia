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

    // Sales by Product (top selling products)
    const salesByProductData = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$products' },
      { $group: {
          _id: '$products.product.name',
          value: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } },
          units: { $sum: '$products.quantity' }
      }},
      { $match: { _id: { $ne: null } } }, // Exclude orders without a product name
      { $project: {
          name: '$_id',
          value: 1,
          units: 1,
          _id: 0
      }},
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);

    // Fallback sales by product if no data
    const salesByProduct = salesByProductData.length > 0 ? salesByProductData : [
      { name: 'Product 1', value: 0, units: 0 },
      { name: 'Product 2', value: 0, units: 0 },
      { name: 'Product 3', value: 0, units: 0 },
      { name: 'Product 4', value: 0, units: 0 },
      { name: 'Product 5', value: 0, units: 0 }
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
      salesByProduct
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
// Helper function to get daily sales report for an outlet
const getDailySalesReport = async (outletId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Aggregate sales data from delivered orders for the given day
  const salesData = await Order.aggregate([
    {
      $match: {
        'products.product.outlet': outletId,
        status: 'delivered',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    { $unwind: '$products' },
    {
      $match: {
        'products.product.outlet': outletId, // Ensure product belongs to the outlet
      },
    },
    {
      $group: {
        _id: '$products.product.id',
        productName: { $first: '$products.product.name' },
        totalQuantity: { $sum: '$products.quantity' },
        totalValue: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } },
      },
    },
  ]);

  // 2. Get all products for the outlet to include stock info
  const allProducts = await Product.find({ outlet: outletId }).lean();

  // 3. Combine sales data with all products
  const report = allProducts.map(product => {
    const sale = salesData.find(s => s._id.toString() === product._id.toString());
    return {
      productId: product._id,
      productName: product.productName,
      totalQuantity: sale ? sale.totalQuantity : 0,
      totalValue: sale ? sale.totalValue : 0,
      currentStock: product.numberOfProductsAvailable, // Correct field for stock
      reorderPoint: product.reorderPoint,
    };
  });

  return report;
};

// Main controller to generate and send the daily report
export const getOutletDailySalesReport = async (req, res) => {
  try {
    const { outletId } = req.params;
    const outlet = await Users.findById(outletId);

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    const today = new Date();
    const reportData = await getDailySalesReport(outletId, today);

    const summary = {
      totalSales: reportData.reduce((sum, item) => sum + item.totalValue, 0),
      totalUnitsSold: reportData.reduce((sum, item) => sum + item.totalQuantity, 0),
      totalProducts: reportData.length,
      date: today.toISOString().split('T')[0],
      outletName: outlet.storeName || 'Unnamed Outlet',
    };

    res.status(200).json({ summary, report: reportData });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily sales report',
      error: error.message,
    });
  }
};

import { errorHandler } from '../utils/error.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import mongoose from 'mongoose';

export const getAnalytics = async (req, res, next) => {
  try {
    const { period, outletId, date } = req.query;

    // Validate inputs
    if (!outletId) {
      return next(errorHandler(400, 'Outlet ID is required'));
    }
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return next(errorHandler(400, 'Invalid Outlet ID'));
    }
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      return next(errorHandler(400, 'Invalid period. Must be daily, weekly, monthly, or yearly'));
    }
    if (date && isNaN(Date.parse(date))) {
      return next(errorHandler(400, 'Invalid date format'));
    }

    // Define time range
    const now = new Date();
    let startDate;
    let dateFormat;
    let groupBy;

    if (date) {
      // Specific date filter
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      groupBy = { $hour: '$createdAt' }; // Group by hour for specific date
      dateFormat = { hour: 'numeric', hour12: true };
    } else if (period === 'daily') {
      startDate = new Date(now.setDate(now.getDate() - 7));
      dateFormat = { month: 'short', day: 'numeric' };
      groupBy = { $dayOfMonth: '$createdAt' };
    } else if (period === 'weekly') {
      startDate = new Date(now.setDate(now.getDate() - 28));
      dateFormat = { week: 'numeric' };
      groupBy = { $week: '$createdAt' };
    } else if (period === 'yearly') {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      dateFormat = { month: 'short' };
      groupBy = { $month: '$createdAt' };
    } else {
      // Default to monthly (6 months)
      startDate = new Date(now.setMonth(now.getMonth() - 6));
      dateFormat = { month: 'short' };
      groupBy = { $month: '$createdAt' };
    }

    // Build match stage
    const matchStage = {
      outletId: new mongoose.Types.ObjectId(outletId),
      createdAt: date ? { $gte: startDate, $lte: new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1) } : { $gte: startDate },
    };

    // Aggregate sales and orders data
    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: {
            $cond: {
              if: { $eq: [period, 'weekly'] },
              then: { $concat: ['Week ', { $toString: '$_id' }] },
              else: {
                $dateToString: {
                  format: date ? '%H:%M' : period === 'yearly' || period === 'monthly' ? '%b' : '%b %d',
                  date: {
                    $dateFromParts: {
                      year: 2025,
                      month: period === 'yearly' || period === 'monthly' ? '$_id' : 7,
                      day: period === 'daily' ? '$_id' : 1,
                      hour: date ? '$_id' : 0,
                    },
                  },
                },
              },
            },
          },
          sales: 1,
          orders: 1,
          _id: 0,
        },
      },
    ]);

    // Aggregate sales by category
    const categoryData = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          value: { $sum: { $multiply: ['$products.quantity', '$product.productPrice'] } },
        },
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0,
        },
      },
    ]);

    // Aggregate top products
    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product._id',
          name: { $first: '$product.productName' },
          category: { $first: '$product.category' },
          sales: { $sum: { $multiply: ['$products.quantity', '$product.productPrice'] } },
          units: { $sum: '$products.quantity' },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
      {
        $project: {
          id: '$_id',
          name: 1,
          category: 1,
          sales: 1,
          units: 1,
          _id: 0,
        },
      },
    ]);

    // Calculate summary data
    const summaryData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $project: {
          totalSales: 1,
          totalOrders: 1,
          averageOrderValue: { $cond: [{ $eq: ['$totalOrders', 0] }, 0, { $divide: ['$totalSales', '$totalOrders'] }] },
          totalProducts: { $literal: topProducts.length },
          _id: 0,
        },
      },
    ]).then((results) => results[0] || { totalSales: 0, totalOrders: 0, averageOrderValue: 0, totalProducts: 0 });

    res.status(200).json({
      success: true,
      data: {
        salesData,
        categoryData,
        topProducts,
        summaryData,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    next(errorHandler(500, error.message));
  }
};

export const getSales = async (req, res, next) => {
     try {
       const { outletId, period, search, minAmount, maxAmount, page = 1, limit = 10 } = req.query;
       if (!outletId) return next(errorHandler(400, 'Outlet ID is required'));
       if (!mongoose.Types.ObjectId.isValid(outletId)) return next(errorHandler(400, 'Invalid Outlet ID'));

       const matchStage = { outletId: new mongoose.Types.ObjectId(outletId) };
       if (period && period !== 'all') {
         const now = new Date();
         let startDate;
         if (period === 'daily') startDate = new Date(now.setDate(now.getDate() - 1));
         else if (period === 'weekly') startDate = new Date(now.setDate(now.getDate() - 7));
         else if (period === 'monthly') startDate = new Date(now.setMonth(now.getMonth() - 1));
         matchStage.createdAt = { $gte: startDate };
       }
       if (minAmount) matchStage.totalAmount = { $gte: Number(minAmount) };
       if (maxAmount) matchStage.totalAmount = { ...matchStage.totalAmount, $lte: Number(maxAmount) };
       if (search) matchStage._id = { $regex: search, $options: 'i' };

       const sales = await Order.find(matchStage)
         .skip((page - 1) * limit)
         .limit(Number(limit))
         .select('_id createdAt totalAmount products status')
         .lean()
         .then((docs) => docs.map((doc) => ({
           _id: doc._id,
           date: doc.createdAt,
           amount: doc.totalAmount,
           items: doc.products.reduce((sum, p) => sum + p.quantity, 0),
           status: doc.status || 'completed',
         })));

       const summary = await Order.aggregate([
         { $match: matchStage },
         {
           $group: {
             _id: null,
             totalSales: { $sum: '$totalAmount' },
             saleCount: { $sum: 1 },
           },
         },
         {
           $project: {
             totalSales: 1,
             saleCount: 1,
             averageSale: { $cond: [{ $eq: ['$saleCount', 0] }, 0, { $divide: ['$totalSales', '$saleCount'] }] },
             _id: 0,
           },
         },
       ]).then((results) => results[0] || { totalSales: 0, saleCount: 0, averageSale: 0 });

       const totalSales = await Order.countDocuments(matchStage);
       const totalPages = Math.ceil(totalSales / limit);

       res.status(200).json({
         success: true,
         sales,
         summary,
         totalSales,
         totalPages,
       });
     } catch (error) {
       console.error('Get sales error:', error);
       next(errorHandler(500, error.message));
     }
   };
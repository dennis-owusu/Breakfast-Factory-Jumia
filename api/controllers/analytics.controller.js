import { errorHandler } from '../utils/error.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import Categories from '../models/categories.model.js';
import mongoose from 'mongoose';
import User from '../models/users.model.js'

export const getAnalytics = async (req, res, next) => {
  try {
    const { period, outletId, date } = req.query;

    // Validate inputs
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      return next(errorHandler(400, 'Invalid period. Must be daily, weekly, monthly, or yearly'));
    }
    if (date && isNaN(Date.parse(date))) {
      return next(errorHandler(400, 'Invalid date format'));
    }

    // Define time range based on current date
    let startDate;
    let endDate = new Date(); // Current date
    let dateFormat;
    let groupBy;

    if (date) {
      // Specific date filter
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      groupBy = { $hour: '$createdAt' }; // Group by hour for specific date
      dateFormat = { hour: 'numeric', hour12: true };
    } else if (period === 'daily') {
      // Last 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      dateFormat = { month: 'short', day: 'numeric' };
      groupBy = { $dayOfMonth: '$createdAt' };
    } else if (period === 'weekly') {
      // Last 4 weeks
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);
      dateFormat = { week: 'numeric' };
      groupBy = { $week: '$createdAt' };
    } else if (period === 'yearly') {
      // Last 12 months
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = { month: 'short' };
      groupBy = { $month: '$createdAt' };
    } else {
      // Default to monthly (last 6 months)
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      dateFormat = { month: 'short' };
      groupBy = { $month: '$createdAt' };
    }

    // Build match stage - Remove outletId filtering as requested
    const matchStage = {};
    // Filter by date range
    matchStage.createdAt = { $gte: startDate, $lte: endDate };

    // Aggregate sales and orders data
    let salesData = [];
    try {
      console.log('Analytics query - Match stage:', JSON.stringify(matchStage));
      
      salesData = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: groupBy,
            sales: { $sum: '$totalPrice' },
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
                        year: { $year: new Date() },
                        month: period === 'yearly' || period === 'monthly' ? '$_id' : { $month: new Date() },
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
      
      console.log('Sales data results:', salesData);
    } catch (salesError) {
      console.error('Error aggregating sales data:', salesError);
      salesData = [];
    }

    // Aggregate sales by category
    let categoryData = [];
    try {
      // Check if there are any orders matching the criteria before running the aggregation
      const hasOrders = await Order.countDocuments(matchStage);
      
      if (hasOrders > 0) {
        categoryData = await Order.aggregate([
          { $match: matchStage },
          { $unwind: '$products' },
          {
            $lookup: {
              from: 'products',
              localField: 'products.product._id',
              foreignField: '_id',
              as: 'productDetails',
            },
          },
          { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: { $ifNull: ['$productDetails.category', 'Uncategorized'] },
              value: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } },
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
      }
      
      // If no data or empty result, ensure we return a properly formatted empty array
      if (!categoryData || categoryData.length === 0) {
        categoryData = [];
      }
      
      console.log('Category data results:', categoryData);
    } catch (categoryError) {
      console.error('Error aggregating category data:', categoryError);
      categoryData = [];
    }

    // User and outlet growth
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, role: 'user' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', users: '$count', _id: 0 } }
    ]);

    const outletGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, role: 'outlet' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', outlets: '$count', _id: 0 } }
    ]);

    // Aggregate top products
    let topProducts = [];
    try {
      // Check if there are any orders matching the criteria before running the aggregation
      const hasOrders = await Order.countDocuments(matchStage);
      
      if (hasOrders > 0) {
        topProducts = await Order.aggregate([
          { $match: matchStage },
          { $unwind: '$products' },
          {
            $lookup: {
              from: 'products',
              localField: 'products.product._id',
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
          {
            $group: {
              _id: { $ifNull: ['$productDetails._id', '$products.product._id'] },
              name: { $first: { $ifNull: ['$productDetails.productName', '$products.product.name'] } },
              category: { $first: { $ifNull: ['$categoryDetails.categoryName', 'Uncategorized'] } },
              sales: { $sum: { $multiply: ['$products.quantity', { $ifNull: ['$productDetails.productPrice', '$products.product.price'] }] } },
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
      }
      
      // If no data or empty result, ensure we return a properly formatted empty array
      if (!topProducts || topProducts.length === 0) {
        topProducts = [];
      }
      
      console.log('Top products results:', topProducts);
    } catch (topProductsError) {
      console.error('Error aggregating top products data:', topProductsError);
      topProducts = [];
    }

    // Calculate summary data
    let summaryData = { totalSales: 0, totalOrders: 0, averageOrderValue: 0, totalProducts: 0 };
    try {
      // Check if there are any orders matching the criteria before running the aggregation
      const hasOrders = await Order.countDocuments(matchStage);
      
      if (hasOrders > 0) {
        const summaryResults = await Order.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$totalPrice' },
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
        ]);
        
        if (summaryResults && summaryResults.length > 0) {
          summaryData = summaryResults[0];
        }
      }
      
      console.log('Summary data results:', summaryData);
    } catch (summaryError) {
      console.error('Error aggregating summary data:', summaryError);
    }

    res.status(200).json({
      success: true,
      data: {
        salesData,
        categoryData,
        topProducts,
        summaryData,
        userGrowth,
        outletGrowth,
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

       const matchStage = {};
       // Remove outletId validation as requested
       
       if (period && period !== 'all') {
         // Use current date ranges
         let startDate;
         let endDate = new Date(); // Current date
         
         if (period === 'daily') {
           // Last day
           startDate = new Date();
           startDate.setDate(startDate.getDate() - 1);
         }
         else if (period === 'weekly') {
           // Last 7 days
           startDate = new Date();
           startDate.setDate(startDate.getDate() - 7);
         }
         else if (period === 'monthly') {
           // Last 30 days
           startDate = new Date();
           startDate.setDate(startDate.getDate() - 30);
         }
         else if (period === 'yearly') {
           // Last 365 days
           startDate = new Date();
           startDate.setDate(startDate.getDate() - 365);
         }
         
         matchStage.createdAt = { $gte: startDate, $lte: endDate };
       }
       if (minAmount) matchStage.totalPrice = { $gte: Number(minAmount) };
       if (maxAmount) matchStage.totalPrice = { ...matchStage.totalPrice, $lte: Number(maxAmount) };
       if (search) matchStage._id = { $regex: search, $options: 'i' };

       const sales = await Order.find(matchStage)
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(Number(limit))
         .select('_id createdAt totalPrice products status')
         .lean()
         .then((docs) => docs.map((doc) => ({
           _id: doc._id,
           date: doc.createdAt,
           amount: doc.totalPrice,
           items: doc.products.reduce((sum, p) => sum + p.quantity, 0),
           status: doc.status || 'completed',
         })));

       const summary = await Order.aggregate([
         { $match: matchStage },
         {
           $group: {
             _id: null,
             totalSales: { $sum: '$totalPrice' },
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
       
       console.log('Sales summary results:', summary);

       const totalSalesCount = await Order.countDocuments(matchStage);
       const totalPages = Math.ceil(totalSalesCount / limit);

       res.status(200).json({
         success: true,
         sales,
         summary,
         totalSales: totalSalesCount,
         totalPages,
       });
     } catch (error) {
       console.error('Get sales error:', error);
       next(errorHandler(500, error.message));
     }
   };
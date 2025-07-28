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
    let productData = [];
    try {
      // Check if there are any orders matching the criteria before running the aggregation
      const hasOrders = await Order.countDocuments(matchStage);
      
      if (hasOrders > 0) {
        productData = await Order.aggregate([
          { $match: matchStage },
          { $unwind: '$products' },
          {
            $group: {
              _id: { name: '$products.product.name', price: '$products.product.price' },
              name: { $first: '$products.product.name' },
              totalValue: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } },
            }
          },
          {            $project: {              name: '$name',              value: '$totalValue',              units: { $sum: '$products.quantity' },              _id: 0,            },          },          { $sort: { units: -1 } },
          { $limit: 5 },
        ]);
      }
      
      // If no data or empty result, ensure we return a properly formatted empty array
      if (!productData || productData.length === 0) {
        productData = [];
      }
      
      console.log('Product data results:', productData);
    } catch (productError) {
      console.error('Error aggregating product data:', productError);
      productData = [];
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
            $group: {
              _id: { name: '$products.product.name', price: '$products.product.price' },
              name: { $first: '$products.product.name' },
              price: { $first: '$products.product.price' },
              sales: { $sum: { $multiply: ['$products.quantity', '$products.product.price'] } },
              units: { $sum: '$products.quantity' },
            }
          },
          {
            $lookup: {
              from: 'products',
              let: { productName: '$name', productPrice: '$price' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$productName', '$$productName'] },
                        { $eq: ['$productPrice', '$$productPrice'] }
                      ]
                    }
                  }
                }
              ],
              as: 'productDetails'
            }
          },
          // Now lookup product details for additional info
          {
            $lookup: {
              from: 'products',
              localField: '_id',
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
              name: '$name',
              category: { $ifNull: [{ $arrayElemAt: ['$categoryDetails.categoryName', 0] }, 'Uncategorized'] },
              sales: 1,
              units: 1,
              _id: 0,
            },
          },
          { $sort: { units: -1 } },
          { $limit: 5 },
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
        productData,
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
           // Today only
           startDate = new Date();
           startDate.setHours(0, 0, 0, 0);
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

// Get all sales data for download (CSV/Excel/PDF format)
export const getAdminSalesReport = async (req, res, next) => {
  try {
    const { format = 'pdf', period, startDate, endDate } = req.query;
    
    console.log('Generating admin sales report with params:', { period, startDate, endDate, format });
    
    // Build date range filter
    const dateFilter = {};
    const currentDate = new Date();
    
    if (startDate && endDate) {
      // Custom date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter.createdAt = { $gte: start, $lte: end };
      console.log('Using custom date range:', { start, end });
    } else if (period) {
      // Predefined periods
      const end = new Date();
      let start = new Date();
      
      switch (period) {
        case 'daily':
          // Today
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          // Last 7 days
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          // Last 30 days
          start.setDate(start.getDate() - 30);
          break;
        case 'yearly':
          // Last 365 days
          start.setDate(start.getDate() - 365);
          break;
        default:
          // Default to last 30 days
          start.setDate(start.getDate() - 30);
      }
      
      dateFilter.createdAt = { $gte: start, $lte: end };
      console.log(`Using ${period} period:`, { start, end });
    } else {
      // Default to all time if no period or date range specified
      console.log('No period or date range specified, using all time');
    }
    
    console.log('Fetching orders with filter:', dateFilter);
    // Get all orders with the date filter
    const orders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();
    
    console.log(`Found ${orders.length} orders matching date filter`);
    
    // Transform data for report
    const reportData = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString().split('T')[0],
      time: order.createdAt.toISOString().split('T')[1].substring(0, 8),
      customerName: order.userInfo?.name || order.user?.name || 'Guest',
      customerEmail: order.userInfo?.email || order.user?.email || 'N/A',
      totalAmount: order.totalAmount,
      itemCount: order.products?.reduce((sum, p) => sum + p.quantity, 0) || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.momoTransactionId ? 'paid' : 'pending',
      orderStatus: order.status,
      shippingAddress: `${order.address || ''}, ${order.city || ''}, ${order.state || ''}`.trim(),
      phoneNumber: order.phoneNumber || 'N/A'
    }));
    
    console.log(`Transformed ${reportData.length} orders for the report`);
    
    // Calculate summary
    const summary = {
      totalOrders: reportData.length,
      totalSales: reportData.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: reportData.length > 0 ? 
        reportData.reduce((sum, order) => sum + order.totalAmount, 0) / reportData.length : 0,
      reportGeneratedAt: new Date().toISOString(),
      dateRange: dateFilter.createdAt ? 
        `${dateFilter.createdAt.$gte.toISOString().split('T')[0]} to ${dateFilter.createdAt.$lte.toISOString().split('T')[0]}` : 
        'All Time'
    };
    
    console.log('Summary calculated:', summary);
    
    // Set the appropriate content type based on the requested format
    if (format === 'excel') {
      console.log('Generating Excel report');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=admin_sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Excel generation logic...
      
    } else if (format === 'csv') {
      console.log('Generating CSV report');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=admin_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
      
      // CSV generation logic...
      
    } else if (format === 'pdf') {
      console.log('Generating PDF report');
      // For PDF format
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument();
      
      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=admin_sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Pipe the PDF document to the response
      doc.pipe(res);
      
      console.log('Adding content to PDF');
      // Add content to the PDF
      doc.fontSize(20).text('Admin Sales Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date Range: ${summary.dateRange}`, { align: 'center' });
      doc.moveDown().moveDown();
      
      // Add summary section
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Orders: ${summary.totalOrders}`);
      doc.fontSize(12).text(`Total Sales: $${summary.totalSales.toFixed(2)}`);
      doc.fontSize(12).text(`Total Items Sold: ${summary.totalItems}`);
      doc.fontSize(12).text(`Average Order Value: $${summary.averageOrderValue.toFixed(2)}`);
      doc.moveDown().moveDown();
      
      // Only add order details if there are orders
      if (reportData.length > 0) {
        console.log(`Adding ${Math.min(reportData.length, 20)} order details to PDF`);
        // Add table headers
        doc.fontSize(16).text('Order Details', { underline: true });
        doc.moveDown();
        
        // Define table columns
        const tableTop = doc.y;
        const tableHeaders = ['Order #', 'Date', 'Customer', 'Amount', 'Status'];
        const columnWidth = 100;
        
        // Draw table headers
        let currentX = 50;
        tableHeaders.forEach(header => {
          doc.fontSize(10).text(header, currentX, tableTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
        });
        
        // Draw a line under headers
        doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
        
        // Draw table rows
        let rowTop = tableTop + 30;
        reportData.slice(0, 20).forEach(order => { // Limit to first 20 orders to avoid large PDFs
          currentX = 50;
          
          doc.fontSize(9).text(order.orderNumber || order.orderId.toString().substring(0, 8), currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(`${order.date}`, currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(order.customerName, currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(`$${order.totalAmount.toFixed(2)}`, currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(order.orderStatus, currentX, rowTop, { width: columnWidth, align: 'left' });
          
          rowTop += 20;
          
          // Add a new page if we're near the bottom
          if (rowTop > 700) {
            doc.addPage();
            rowTop = 50;
          }
        });
        
        // If there are more orders than shown in the PDF
        if (reportData.length > 20) {
          doc.moveDown().moveDown();
          doc.fontSize(10).text(`Note: Showing 20 of ${reportData.length} total orders. Download in Excel or CSV format for complete data.`, { align: 'center', italic: true });
        }
      } else {
        console.log('No orders found, adding message to PDF');
        // No orders message
        doc.fontSize(14).text('No orders found for the selected period.', { align: 'center', italic: true });
        doc.moveDown();
        doc.fontSize(12).text('Try selecting a different date range or check if there are any orders.', { align: 'center' });
      }
      
      console.log('Finalizing PDF document');
      // Finalize the PDF and end the stream
      doc.end();
      return; // Important: return here to prevent further execution
    }

    // For Excel and CSV formats, send JSON response
    res.status(200).json({
      success: true,
      reportData,
      summary
    });
  } catch (error) {
    console.error('Get admin sales report error:', error);
    next(errorHandler(500, error.message));
  }
};

// Get outlet sales data for download (CSV/Excel/PDF format)
export const getOutletSalesReport = async (req, res) => {
  try {
    const { outletId } = req.params;
    const { format = 'pdf', period, startDate, endDate } = req.query;
    
    console.log('Generating outlet sales report with params:', { outletId, period, startDate, endDate, format });
    
    const currentDate = new Date();
    let dateFilter = {};
    
    // This validation is removed as requested
    // if (!outletId) return res.status(400).json({ message: 'Outlet ID is required' });
    
    // Set date filter based on period or date range
    if (startDate && endDate) {
      // Custom date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter.createdAt = { $gte: start, $lte: end };
      console.log('Using custom date range:', { start, end });
    } else if (period) {
      // Predefined periods
      const end = new Date();
      let start = new Date();
      
      switch (period) {
        case 'daily':
          // Today
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          // Last 7 days
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          // Last 30 days
          start.setDate(start.getDate() - 30);
          break;
        case 'yearly':
          // Last 365 days
          start.setDate(start.getDate() - 365);
          break;
        default:
          // Default to last 30 days
          start.setDate(start.getDate() - 30);
      }
      
      dateFilter.createdAt = { $gte: start, $lte: end };
      console.log(`Using ${period} period:`, { start, end });
    } else {
      // Default to all time if no period or date range specified
      console.log('No period or date range specified, using all time');
      // Remove date filter to get all orders
    }

    // Get all orders with the date filter
    console.log('Fetching orders with filter:', dateFilter);
    const allOrders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();
    
    console.log(`Found ${allOrders.length} orders matching date filter`);
    
    // Filter orders to include only those with products from this outlet
    const outletOrders = [];
    
    for (const order of allOrders) {
      // Check if any product in this order belongs to the outlet
      let outletTotal = 0;
      let outletItemCount = 0;
      let hasOutletProducts = false;
      
      console.log(`Processing order ${order._id}, with ${order.products?.length || 0} products`);
      
      if (!order.products || order.products.length === 0) {
        console.log('Order has no products, skipping');
        continue;
      }
      
      for (const product of order.products) {
        console.log(`Checking product ${product.product?.id || 'unknown'}, outlet:`, product.product?.outlet);
        
        // Check if the product belongs to the requested outlet
        // The outlet can be either an object with an id or a direct ObjectId reference
        const productOutletId = product.product?.outlet?._id || product.product?.outlet;
        
        console.log(`Product outlet ID: ${productOutletId}, comparing with requested outlet ID: ${outletId}`);
        
        if (product.product && productOutletId && productOutletId.toString() === outletId) {
          hasOutletProducts = true;
          // Use the product's price from the nested structure
          outletTotal += product.product.price * product.quantity;
          outletItemCount += product.quantity;
          console.log(`Product belongs to outlet, adding to totals. Current totals: ${outletTotal}, items: ${outletItemCount}`);
        }
      }
      
      if (hasOutletProducts) {
        outletOrders.push({
          ...order,
          outletTotal,
          outletItemCount
        });
        console.log(`Order added to outlet orders. Now have ${outletOrders.length} outlet orders`);
      }
    }
    
    console.log(`Filtered to ${outletOrders.length} orders with products from outlet ${outletId}`);

    // Transform data for report
    const reportData = outletOrders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString().split('T')[0],
      time: order.createdAt.toISOString().split('T')[1].substring(0, 8),
      customerName: order.userInfo?.name || order.user?.name || 'Guest',
      customerEmail: order.userInfo?.email || order.user?.email || 'N/A',
      totalAmount: order.outletTotal || 0,
      itemCount: order.outletItemCount || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.momoTransactionId ? 'paid' : 'pending',
      orderStatus: order.status,
      shippingAddress: `${order.address || ''}, ${order.city || ''}, ${order.state || ''}`.trim(),
      phoneNumber: order.phoneNumber || 'N/A'
    }));

    console.log(`Transformed ${reportData.length} orders for the report`);

    // Calculate summary
    const summary = {
      totalOrders: reportData.length,
      totalSales: reportData.reduce((sum, order) => sum + order.totalAmount, 0),
      totalItems: reportData.reduce((sum, order) => sum + order.itemCount, 0),
      averageOrderValue: reportData.length > 0 ? 
        reportData.reduce((sum, order) => sum + order.totalAmount, 0) / reportData.length : 0,
      reportGeneratedAt: new Date().toISOString(),
      dateRange: dateFilter.createdAt ? 
        `${dateFilter.createdAt.$gte.toISOString().split('T')[0]} to ${dateFilter.createdAt.$lte.toISOString().split('T')[0]}` : 
        'All Time'
    };

    console.log('Summary calculated:', summary);

    // Set the appropriate content type based on the requested format
    if (format === 'excel') {
      console.log('Generating Excel report');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=outlet_sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Excel generation logic...
      
    } else if (format === 'csv') {
      console.log('Generating CSV report');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=outlet_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
      
      // CSV generation logic...
      
    } else if (format === 'pdf') {
      console.log('Generating PDF report');
      // For PDF format
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument();
      
      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=outlet_sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Pipe the PDF document to the response
      doc.pipe(res);
      
      console.log('Adding content to PDF');
      // Add content to the PDF
      doc.fontSize(20).text('Outlet Sales Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date Range: ${summary.dateRange}`, { align: 'center' });
      doc.moveDown().moveDown();
      
      // Add summary section
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Orders: ${summary.totalOrders}`);
      doc.fontSize(12).text(`Total Sales: $${summary.totalSales.toFixed(2)}`);
      doc.fontSize(12).text(`Total Items Sold: ${summary.totalItems}`);
      doc.fontSize(12).text(`Average Order Value: $${summary.averageOrderValue.toFixed(2)}`);
      doc.moveDown().moveDown();
      
      // Only add order details if there are orders
      if (reportData.length > 0) {
        console.log(`Adding ${Math.min(reportData.length, 20)} order details to PDF`);
        // Add table headers
        doc.fontSize(16).text('Order Details', { underline: true });
        doc.moveDown();
        
        // Define table columns
        const tableTop = doc.y;
        const tableHeaders = ['Order #', 'Date', 'Customer', 'Amount', 'Status'];
        const columnWidth = 100;
        
        // Draw table headers
        let currentX = 50;
        tableHeaders.forEach(header => {
          doc.fontSize(10).text(header, currentX, tableTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
        });
        
        // Draw a line under headers
        doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
        
        // Draw table rows
        let rowTop = tableTop + 30;
        reportData.slice(0, 20).forEach(order => { // Limit to first 20 orders to avoid large PDFs
          currentX = 50;
          
          doc.fontSize(9).text(order.orderNumber || order.orderId.toString().substring(0, 8), currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(`${order.date}`, currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(order.customerName, currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(`$${order.totalAmount.toFixed(2)}`, currentX, rowTop, { width: columnWidth, align: 'left' });
          currentX += columnWidth;
          
          doc.fontSize(9).text(order.orderStatus, currentX, rowTop, { width: columnWidth, align: 'left' });
          
          rowTop += 20;
          
          // Add a new page if we're near the bottom
          if (rowTop > 700) {
            doc.addPage();
            rowTop = 50;
          }
        });
        
        // If there are more orders than shown in the PDF
        if (reportData.length > 20) {
          doc.moveDown().moveDown();
          doc.fontSize(10).text(`Note: Showing 20 of ${reportData.length} total orders. Download in Excel or CSV format for complete data.`, { align: 'center', italic: true });
        }
      } else {
        console.log('No orders found, adding message to PDF');
        // No orders message
        doc.fontSize(14).text('No orders found for the selected period.', { align: 'center', italic: true });
        doc.moveDown();
        doc.fontSize(12).text('Try selecting a different date range or check if there are any orders.', { align: 'center' });
      }
      
      console.log('Finalizing PDF document');
      // Finalize the PDF and end the stream
      doc.end();
      return; // Important: return here to prevent further execution
    }

    // For Excel and CSV formats, send JSON response
    res.status(200).json({
      success: true,
      reportData,
      summary
    });
  } catch (error) {
    console.error('Get outlet sales report error:', error);
    next(errorHandler(500, error.message));
  }
};
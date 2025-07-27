import Credit from '../models/credit.model.js';
import Order from '../models/order.model.js';
import Users from '../models/users.model.js';
import { errorHandler } from '../utils/error.js';
import axios from 'axios';

// Create a new credit transaction
export const createCreditTransaction = async (req, res, next) => {
  try {
    const { userId, orderId, amount, dueDate, notes } = req.body;
    
    // Verify the order exists and belongs to the user
    const order = await Order.findById(orderId);
    if (!order) {
      return next(errorHandler(404, 'Order not found'));
    }
    
    if (order.user.toString() !== userId) {
      return next(errorHandler(403, 'This order does not belong to the specified user'));
    }
    
    // Get the outlet ID from the order (assuming first product's outlet)
    const outletId = order.products[0].product.outlet;
    
    // Check if the user has sufficient credit limit
    const user = await Users.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    if (user.totalCreditUsed + amount > user.creditLimit) {
      return next(errorHandler(400, 'Credit limit exceeded'));
    }
    
    // Create the credit transaction
    const creditTransaction = new Credit({
      user: userId,
      outlet: outletId,
      order: orderId,
      amount,
      dueDate: new Date(dueDate),
      status: 'pending',
      payments: [],
      notes,
      remainingAmount: amount
    });
    
    await creditTransaction.save();
    
    // Update the order's payment method and credit status
    order.paymentMethod = 'credit';
    order.creditStatus = 'pending';
    await order.save();
    
    // Update user's credit information
    user.totalCreditUsed += amount;
    user.creditHistory.push({
      amount,
      date: new Date(),
      outlet: outletId,
      order: orderId,
      status: 'pending'
    });
    await user.save();
    
    res.status(201).json({
      success: true,
      data: creditTransaction
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Get all credit transactions for a user
export const getUserCreditTransactions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists
    const user = await Users.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    // Check authorization
    if (req.user.id !== userId && req.user.usersRole !== 'admin') {
      return next(errorHandler(403, 'You are not authorized to view this user\'s credit transactions'));
    }
    
    const creditTransactions = await Credit.find({ user: userId })
      .populate('outlet', 'name storeName email')
      .populate('order', 'orderNumber totalPrice status')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: creditTransactions.length,
      data: creditTransactions
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Get all credit transactions for an outlet
export const getOutletCreditTransactions = async (req, res, next) => {
  try {
    const { outletId } = req.params;
    
    // Verify outlet exists
    const outlet = await Users.findById(outletId);
    if (!outlet || outlet.usersRole !== 'outlet') {
      return next(errorHandler(404, 'Outlet not found'));
    }
    
    // Check authorization
    if (req.user.id !== outletId && req.user.usersRole !== 'admin') {
      return next(errorHandler(403, 'You are not authorized to view this outlet\'s credit transactions'));
    }
    
    const creditTransactions = await Credit.find({ outlet: outletId })
      .populate('user', 'name email phoneNumber')
      .populate('order', 'orderNumber totalPrice status')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: creditTransactions.length,
      data: creditTransactions
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Get all credit transactions (admin only)
export const getAllCreditTransactions = async (req, res, next) => {
  try {
    // Check if admin
    if (req.user.usersRole !== 'admin') {
      return next(errorHandler(403, 'Only admins can view all credit transactions'));
    }
    
    const { status, sortBy, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options
    let sort = { createdAt: -1 }; // Default sort by creation date (newest first)
    if (sortBy === 'dueDate') {
      sort = { dueDate: 1 }; // Sort by due date (earliest first)
    } else if (sortBy === 'amount') {
      sort = { amount: -1 }; // Sort by amount (highest first)
    }
    
    const creditTransactions = await Credit.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('outlet', 'name storeName email')
      .populate('order', 'orderNumber totalPrice status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Credit.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: creditTransactions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: creditTransactions
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Record a payment for a credit transaction
export const recordCreditPayment = async (req, res, next) => {
  try {
    const { creditId } = req.params;
    const { amount, paymentMethod, reference, notes } = req.body;
    
    // Verify credit transaction exists
    const creditTransaction = await Credit.findById(creditId);
    if (!creditTransaction) {
      return next(errorHandler(404, 'Credit transaction not found'));
    }
    
    // Check authorization
    if (req.user.id !== creditTransaction.user.toString() && req.user.usersRole !== 'admin' && req.user.usersRole !== 'outlet') {
      return next(errorHandler(403, 'You are not authorized to record payments for this credit transaction'));
    }
    
    // Validate payment amount
    if (amount <= 0) {
      return next(errorHandler(400, 'Payment amount must be greater than zero'));
    }
    
    if (amount > creditTransaction.remainingAmount) {
      return next(errorHandler(400, 'Payment amount exceeds remaining balance'));
    }
    
    let verified = true;
    if (paymentMethod === 'paystack' && reference) {
      try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        });
        const data = response.data;
        if (!data.status || data.data.status !== 'success' || data.data.amount / 100 !== amount) {
          verified = false;
        }
      } catch (error) {
        return next(errorHandler(500, 'Payment verification failed'));
      }
    }
    
    if (!verified) {
      return next(errorHandler(400, 'Invalid payment reference'));
    }
    
    // Record the payment
    creditTransaction.payments.push({
      amount,
      date: new Date(),
      paymentMethod,
      reference,
      notes,
    });
    
    // Update remaining amount
    creditTransaction.remainingAmount -= amount;
    
    // Update status
    let status = creditTransaction.remainingAmount === 0 ? 'paid' : 'partially_paid';
    if (new Date() > creditTransaction.dueDate && status !== 'paid') {
      status = 'overdue';
    }
    creditTransaction.status = status;
    
    await creditTransaction.save();
    
    // Update order credit status
    const order = await Order.findById(creditTransaction.order);
    if (order) {
      order.creditStatus = creditTransaction.status;
      await order.save();
    }
    
    // Update user's credit history and totalCreditUsed
    const user = await Users.findById(creditTransaction.user);
    if (user) {
      const creditHistoryEntry = user.creditHistory.find(
        entry => entry.order.toString() === creditTransaction.order.toString()
      );
      if (creditHistoryEntry) {
        creditHistoryEntry.status = creditTransaction.status;
      }
      user.totalCreditUsed -= amount;
      if (user.totalCreditUsed < 0) user.totalCreditUsed = 0;
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      data: creditTransaction
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Update credit transaction (admin only)
export const updateCreditTransaction = async (req, res, next) => {
  try {
    const { creditId } = req.params;
    const { dueDate, status, notes } = req.body;
    
    // Only admin can update credit transactions
    if (req.user.usersRole !== 'admin') {
      return next(errorHandler(403, 'Only admins can update credit transactions'));
    }
    
    // Verify credit transaction exists
    const creditTransaction = await Credit.findById(creditId);
    if (!creditTransaction) {
      return next(errorHandler(404, 'Credit transaction not found'));
    }
    
    // Update fields
    if (dueDate) creditTransaction.dueDate = new Date(dueDate);
    if (status) creditTransaction.status = status;
    if (notes) creditTransaction.notes = notes;
    
    await creditTransaction.save();
    
    // Update order credit status if status changed
    if (status) {
      const order = await Order.findById(creditTransaction.order);
      if (order) {
        order.creditStatus = status;
        await order.save();
      }
      
      // Update user's credit history
      const user = await Users.findById(creditTransaction.user);
      if (user) {
        // Find the credit history entry for this order
        const creditHistoryEntry = user.creditHistory.find(
          entry => entry.order.toString() === creditTransaction.order.toString()
        );
        
        if (creditHistoryEntry) {
          creditHistoryEntry.status = status;
          await user.save();
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: creditTransaction
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Update user credit limit (admin only)
export const updateUserCreditLimit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { creditLimit } = req.body;
    
    // Only admin can update credit limits
    if (req.user.usersRole !== 'admin') {
      return next(errorHandler(403, 'Only admins can update credit limits'));
    }
    
    // Verify user exists
    const user = await Users.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    // Update credit limit
    user.creditLimit = creditLimit;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        creditLimit: user.creditLimit,
        totalCreditUsed: user.totalCreditUsed
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Get credit summary for dashboard
export const getCreditSummary = async (req, res, next) => {
  try {
    // Check if admin or outlet
    if (req.user.usersRole !== 'admin' && req.user.usersRole !== 'outlet') {
      return next(errorHandler(403, 'You are not authorized to view credit summary'));
    }
    
    let query = {};
    
    // If outlet, only show their transactions
    if (req.user.usersRole === 'outlet') {
      query.outlet = req.user.id;
    }
    
    // Get summary statistics
    const totalCredits = await Credit.countDocuments(query);
    
    // Total amount of all credits
    const totalCreditAmount = await Credit.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Total remaining amount
    const totalRemainingAmount = await Credit.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);
    
    // Count by status
    const statusCounts = await Credit.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Format status counts
    const statusCountsFormatted = {
      pending: 0,
      partially_paid: 0,
      paid: 0,
      overdue: 0
    };
    
    statusCounts.forEach(item => {
      statusCountsFormatted[item._id] = item.count;
    });
    
    // Get overdue credits
    const currentDate = new Date();
    const overdueCredits = await Credit.countDocuments({
      ...query,
      dueDate: { $lt: currentDate },
      status: { $in: ['pending', 'partially_paid'] }
    });
    
    // Get credits due in the next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingDueCredits = await Credit.countDocuments({
      ...query,
      dueDate: { $gte: currentDate, $lte: nextWeek },
      status: { $in: ['pending', 'partially_paid'] }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalCredits,
        totalCreditAmount: totalCreditAmount.length > 0 ? totalCreditAmount[0].total : 0,
        totalRemainingAmount: totalRemainingAmount.length > 0 ? totalRemainingAmount[0].total : 0,
        statusCounts: statusCountsFormatted,
        overdueCredits,
        upcomingDueCredits
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};
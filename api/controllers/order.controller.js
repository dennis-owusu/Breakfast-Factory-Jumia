import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/users.model.js';
import { errorHandler } from '../utils/error.js';

export const createOrder = async (req, res) => {
  try {
    const { user, products, totalPrice, address, city, state, phoneNumber, orderNumber, postalCode, paymentMethod } = req.body;
    if (!user || !products || products.length === 0 || totalPrice == null || !address || !city || !state || !phoneNumber || !postalCode || !paymentMethod) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Fetch product details and embed them
    const populatedProducts = await Promise.all( 
      products.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }
        return {
          product: {
            orderNumber_1: orderNumber,
            name: product.productName,
            price: product.productPrice,
            images: product.productImage ? [product.productImage] : [],
            outlet: product.outlet || { name: 'Unknown Outlet' },
          },
          quantity: item.quantity,
        };
      })
    );

    const userDoc = await User.findById(user);
    if (!userDoc) {
      throw new Error('User not found');
    }

    const order = new Order({
      user,
      userInfo: {
        name: userDoc.name,
        email: userDoc.email,
        phoneNumber: userDoc.phoneNumber
      },
      products: populatedProducts,
      totalPrice,
      address,
      city,
      state,
      phoneNumber,
      postalCode,
      paymentMethod,
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create order' });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch orders' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phoneNumber');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch order' });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const newStatus = req.body.status || order.status;
    if (order.status !== newStatus) {
      order.status = newStatus;
      await order.save();
      // Emit Socket.IO event for real-time notification
      const io = req.app.get('io');
      if (order.user) {
        io.to(order.user.toString()).emit('orderStatusUpdated', {
          orderId: order._id,
          newStatus: order.status,
          message: `Your order ${order.orderNumber} status has been updated to ${order.status}`
        });
      }
      // Emit to outlets
      const outletIds = [...new Set(order.products
        .filter(p => p.product.outlet && typeof p.product.outlet === 'object' && p.product.outlet.toString) // Ensure it's an ObjectId
        .map(p => p.product.outlet.toString())
      )];
      outletIds.forEach(outletId => {
        io.to(outletId).emit('orderStatusUpdated', {
          orderId: order._id,
          newStatus: order.status,
          message: `Order ${order.orderNumber} status updated to ${order.status}`
        });
      });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update order' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    await order.deleteOne();
    res.status(200).json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete order' });
  }
};

export const getOrdersByUser = async (req, res) => {
  const userId = req.params.id;
  const startIndex = parseInt(req.query.startIndex) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const searchTerm = req.query.searchTerm || '';
  const status = req.query.status;
  const dateFrom = req.query.dateFrom;
  const dateTo = req.query.dateTo;

  let query = { user: userId };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (searchTerm) {
    query.$or = [
      { orderNumber: { $regex: searchTerm, $options: 'i' } },
      { 'products.product.name': { $regex: searchTerm, $options: 'i' } }
    ];
  }

  let dateFilter = {};
  if (dateFrom) {
    dateFilter.$gte = new Date(dateFrom);
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.$lte = toDate;
  }
  if (Object.keys(dateFilter).length > 0) {
    query.createdAt = dateFilter;
  }

  try {
    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    res.status(200).json({ orders, totalOrders });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch user orders' });
  }
};

export const getOutletOrders = async (req, res) => {
  const outletId = req.params.outletId;
  const startIndex = parseInt(req.query.startIndex) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const searchTerm = req.query.searchTerm || '';
  const status = req.query.status;
  const dateRange = req.query.dateRange;

  let query = { 'products.product.outlet': outletId };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (searchTerm) {
    query.orderNumber = { $regex: searchTerm, $options: 'i' };
  }

  let dateFilter = {};
  if (dateRange) {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        dateFilter = { createdAt: { $gte: new Date(now.setHours(0,0,0,0)) } };
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = { createdAt: { $gte: new Date(yesterday.setHours(0,0,0,0)), $lt: new Date(now.setHours(0,0,0,0)) } };
        break;
      case 'last7days':
        const last7 = new Date(now);
        last7.setDate(last7.getDate() - 7);
        dateFilter = { createdAt: { $gte: last7 } };
        break;
      case 'last30days':
        const last30 = new Date(now);
        last30.setDate(last30.getDate() - 30);
        dateFilter = { createdAt: { $gte: last30 } };
        break;
    }
    query = { ...query, ...dateFilter };
  }

  try {
    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    res.status(200).json({ orders, totalOrders });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch outlet orders' });
  }
};
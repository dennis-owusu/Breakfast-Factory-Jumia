import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/users.model.js';
import { errorHandler } from '../utils/error.js';

export const createOrder = async (req, res) => {
  try {
    const { user, products, totalPrice, address, city, state, phoneNumber, postalCode, paymentMethod } = req.body;
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
            name: product.productName,
            price: product.productPrice,
            images: product.productImage ? [product.productImage] : [],
            outlet: product.outlet || { name: 'Unknown Outlet' },
          },
          quantity: item.quantity,
        };
      })
    );

    const order = new Order({
      user,
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
    const order = await Order.findById(req.params.id);
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
    order.status = req.body.status || order.status;
    await order.save();
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
  try {
    const orders = await Order.find({ user: req.user.id });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch user orders' });
  }
};
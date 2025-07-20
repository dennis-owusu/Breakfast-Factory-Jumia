import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import dotenv from 'dotenv';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Analytics from '../models/analytics.model.js';
import User from '../models/users.model.js';
import Category from '../models/categories.model.js';
import Payment from '../models/payment.model.js';
import Feedback from '../models/feedback.js';
import { errorHandler } from '../utils/error.js';

dotenv.config();

const token = process.env.GITHUB_TOKEN;
const endpoint = 'https://models.inference.ai.azure.com';
const modelName = 'Llama-3.3-70B-Instruct';

export const askAI = async (req, res, next) => {
  const { question } = req.body;

  try {
    // Query relevant data based on question keywords
    let context = '';

    if (question.toLowerCase().includes('sales') || question.toLowerCase().includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const sales = await Order.aggregate([
        { $match: { createdAt: { $gte: yesterday } } },
        { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]);
      context += `Sales data for yesterday: ${sales[0]?.count || 0} orders, total ${sales[0]?.totalSales || 0}. `;
    }

    if (question.toLowerCase().includes('stock')) {
      const outOfStock = await Product.countDocuments({ numberOfProductsAvailable: 0 });
      const inStock = await Product.countDocuments({ numberOfProductsAvailable: { $gt: 0 } });
      context += `Products: ${inStock} in stock, ${outOfStock} out of stock. `;
    }

    if (question.toLowerCase().includes('best selling') || question.toLowerCase().includes('this week')) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const bestSelling = await Order.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } }
      ]);
      context += `Best selling product this week: ${bestSelling[0]?.product[0]?.productName || 'None'}, sold ${bestSelling[0]?.totalSold || 0} units. `;
    }

    if (question.toLowerCase().includes('products') || question.toLowerCase().includes('how many products')) {
      const totalProducts = await Product.countDocuments();
      context += `Total products in the system: ${totalProducts}. `;
    }

    if (question.toLowerCase().includes('orders') || question.toLowerCase().includes('how many orders')) {
      const totalOrders = await Order.countDocuments();
      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
      context += `Total orders: ${totalOrders}. Recent orders: ${JSON.stringify(recentOrders.map(o => ({ id: o._id, total: o.totalAmount })))}. `;
    }

    if (question.toLowerCase().includes('analytics')) {
      const analyticsData = await Analytics.findOne(); // Adjust based on actual model
      context += `Analytics summary: Total revenue: ${analyticsData?.totalRevenue || 0}, Total users: ${analyticsData?.totalUsers || 0}. `;
    }

    if (question.toLowerCase().includes('predict') || question.toLowerCase().includes('future') || question.toLowerCase().includes('best selling') || question.toLowerCase().includes('bestselling')) {
      let historicalSales = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } }
      ]);
      let predictionContext = `Top bestselling products based on all order data: ${JSON.stringify(historicalSales.map(s => ({ name: s.product[0]?.productName, description: s.product[0]?.description, price: s.product[0]?.price, sold: s.totalSold })))}. `;
      if (historicalSales.length === 0) {
        const allProducts = await Product.find().limit(10);
        predictionContext += `No sales data available yet. Here are some products in the system: ${JSON.stringify(allProducts.map(p => ({ name: p.productName, description: p.description, price: p.price })))}. `;
      }
      predictionContext += 'Use this data to make reasonable predictions for future best-sellers, such as based on current trends or product details if no sales history.';
      context += predictionContext;
    }

    if (question.toLowerCase().includes('users') || question.toLowerCase().includes('customers')) {
      const totalUsers = await User.countDocuments();
      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
      context += `Total users: ${totalUsers}. Recent users: ${JSON.stringify(recentUsers.map(u => ({ id: u._id, username: u.username, role: u.role })))}. `;
    }

    if (question.toLowerCase().includes('categories')) {
      const categories = await Category.find();
      context += `Product categories: ${JSON.stringify(categories.map(c => ({ name: c.name, description: c.description })))}. `;
    }

    if (question.toLowerCase().includes('payments')) {
      const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
      context += `Recent payments: ${JSON.stringify(recentPayments.map(p => ({ id: p._id, amount: p.amount, status: p.status })))}. `;
    }

    if (question.toLowerCase().includes('feedback') || question.toLowerCase().includes('reviews')) {
      const recentFeedback = await Feedback.find().sort({ createdAt: -1 }).limit(5);
      context += `Recent feedback: ${JSON.stringify(recentFeedback.map(f => ({ product: f.product, rating: f.rating, comment: f.comment })))}. `;
    }

    // Add general system details
    const systemDetails = 'The system is a MERN stack e-commerce app with roles: Admin, Outlet, User. Features include product listings, carts, orders, payments (Cash on Delivery), JWT auth, image uploads.';
    context += systemDetails + ' ';


    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const response = await client.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: 'You are a friendly and knowledgeable AI assistant with full real-time access to the e-commerce system\'s data. Always provide precise, specific, and accurate answers based solely on the provided context. If data is limited, make reasonable predictions based on available information without claiming lack of data. Format your responses in a clear, organized manner using markdown: use headings, bullet points, bold text for key information, and short paragraphs for readability. Use the data given to give confident, helpful responses in simple language without technical jargon: ' + context },
          { role: 'user', content: question }
        ],
        temperature: 1.0,
        top_p: 1.0,
        model: modelName
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    res.json({ answer: response.body.choices[0].message.content });
  } catch (err) {
    next(errorHandler(500, err.message));
  }
};
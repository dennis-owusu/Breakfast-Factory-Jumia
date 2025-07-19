import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import dotenv from 'dotenv';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
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

    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const response = await client.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: 'You are a helpful assistant with access to the e-commerce system data. Use the following context to answer: ' + context },
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
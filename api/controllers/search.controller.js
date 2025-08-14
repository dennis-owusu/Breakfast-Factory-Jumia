import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import Users from '../models/users.model.js';
import Analytics from '../models/analytics.model.js';
import Categories from '../models/categories.model.js';
import { errorHandler } from '../utils/error.js';

// Universal search function that searches across multiple models
export const searchDashboard = async (req, res, next) => {
  try {
    const { query, category = 'all', limit = 10 } = req.query;
    const userRole = req.user?.role || 'user';
    const userId = req.user?.id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters long' 
      });
    }

    const searchTerm = query.trim();
    const results = {};

    // Products search
    if (category === 'all' || category === 'products') {
      let productQuery = {
        $or: [
          { productName: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // If user is an outlet, only show their products
      if (userRole === 'outlet') {
        productQuery.outlet = userId;
      }

      const products = await Product.find(productQuery)
        .populate('category', 'categoryName')
        .populate('outlet', 'name storeName')
        .limit(limit)
        .sort({ updatedAt: -1 });

      results.products = products.map(product => ({
        id: product._id,
        name: product.productName,
        price: product.productPrice,
        stock: product.numberOfProductsAvailable,
        category: product.category?.categoryName || 'Uncategorized',
        image: product.productImage,
        outlet: product.outlet?.storeName || product.outlet?.name || 'Unknown Outlet',
        featured: product.featured,
        discountPrice: product.discountPrice
      }));
    }

    // Orders search
    if (category === 'all' || category === 'orders') {
      let orderQuery = {
        $or: [
          { orderNumber: { $regex: searchTerm, $options: 'i' } },
          { 'userInfo.name': { $regex: searchTerm, $options: 'i' } },
          { 'userInfo.email': { $regex: searchTerm, $options: 'i' } },
          { status: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // If user is an outlet, filter orders containing their products
      if (userRole === 'outlet') {
        // First find products for this outlet
        const outletProducts = await Product.find({ outlet: userId });
        const productNames = outletProducts.map(p => p.productName);
        
        // Filter orders that contain products from this outlet
        orderQuery = {
          ...orderQuery,
          'products.product.name': { $in: productNames }
        };
      }

      const orders = await Order.find(orderQuery)
        .populate('user', 'name email')
        .limit(limit)
        .sort({ createdAt: -1 });

      results.orders = orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.userInfo?.name || order.user?.name || 'Guest',
        email: order.userInfo?.email || order.user?.email || '',
        date: order.createdAt.toISOString().split('T')[0],
        total: order.totalPrice,
        status: order.status,
        itemCount: order.products.length
      }));
    }

    // Customers/Users search (Admin only or outlet can see their customers)
    if ((category === 'all' || category === 'customers') && (userRole === 'admin' || userRole === 'outlet')) {
      let userQuery = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { storeName: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // For outlets, show all users (potential customers)
      // For admin, show all users
      if (userRole === 'outlet') {
        userQuery.usersRole = { $in: ['user'] }; // Only show regular users to outlets
      }

      const users = await Users.find(userQuery)
        .select('name email usersRole storeName createdAt phoneNumber')
        .limit(limit)
        .sort({ createdAt: -1 });

      // Calculate orders and total spent for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const userOrders = await Order.find({ user: user._id });
          const totalSpent = userOrders.reduce((sum, order) => sum + order.totalPrice, 0);
          
          return {
            id: user._id,
            name: user.name,
            email: user.email, 
            role: user.usersRole,
            storeName: user.storeName,
            phoneNumber: user.phoneNumber,
            joinDate: user.createdAt.toISOString().split('T')[0],
            orders: userOrders.length,
            totalSpent: totalSpent
          };
        })
      );

      results.customers = usersWithStats;
    }

    // Analytics search (placeholder for now)
    if (category === 'all' || category === 'analytics') {
      // This could search through analytics reports, saved queries, etc.
      const analyticsItems = [
        { 
          id: 1, 
          title: 'Sales Performance', 
          period: 'Current Month', 
          type: 'report',
          description: 'Monthly sales and revenue analysis'
        },
        { 
          id: 2, 
          title: 'Product Analytics', 
          period: 'Last 30 days', 
          type: 'dashboard',
          description: 'Product performance and stock levels'
        },
        { 
          id: 3, 
          title: 'Customer Insights', 
          period: 'Quarter', 
          type: 'analysis',
          description: 'Customer behavior and retention metrics'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );

      results.analytics = analyticsItems;
    }

    // Return results
    res.status(200).json({
      success: true,
      query: searchTerm,
      category,
      results,
      totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    });

  } catch (error) {
    console.error('Search error:', error);
    next(errorHandler(500, 'Error performing search'));
  }
};

// Quick search suggestions
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'user';
    const userId = req.user?.id;

    let suggestions = [];

    if (userRole === 'admin') {
      suggestions = [
        'Low stock products',
        'Recent orders',
        'Monthly sales',
        'Top customers',
        'Pending deliveries',
        'Revenue this week',
        'New outlets',
        'Product categories'
      ];
    } else if (userRole === 'outlet') {
      suggestions = [
        'My products',
        'Recent orders',
        'Low stock items',
        'Monthly sales',
        'Pending orders',
        'Best sellers',
        'Customer feedback'
      ];
    } else {
      suggestions = [
        'My orders',
        'Order history',
        'Track delivery',
        'Account settings'
      ];
    }

    res.status(200).json({
      success: true,
      suggestions
    });

  } catch (error) {
    next(errorHandler(500, 'Error getting search suggestions'));
  }
};
import User from '../models/User.js';
import Outlet from '../models/Outlet.js';
import Product from '../models/Product.js';

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const outletCount = await Outlet.countDocuments();
    const productCount = await Product.countDocuments();
    const pendingOutlets = await Outlet.countDocuments({ isVerified: false });

    // Get user distribution by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get product distribution by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent users
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent outlets
    const recentOutlets = await Outlet.find()
      .select('name location isVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          users: userCount,
          outlets: outletCount,
          products: productCount,
          pendingOutlets
        },
        usersByRole,
        productsByCategory,
        recentUsers,
        recentOutlets
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats'
    });
  }
};

/**
 * @desc    Get all outlets (admin view)
 * @route   GET /api/admin/outlets
 * @access  Private/Admin
 */
export const getAllOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find()
      .populate({
        path: 'ownerId',
        select: 'name email'
      });

    return res.status(200).json({
      success: true,
      count: outlets.length,
      data: outlets
    });
  } catch (error) {
    console.error('Get all outlets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching outlets'
    });
  }
};

/**
 * @desc    Get pending outlet verifications
 * @route   GET /api/admin/outlets/pending
 * @access  Private/Admin
 */
export const getPendingOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find({ isVerified: false })
      .populate({
        path: 'ownerId',
        select: 'name email'
      });

    return res.status(200).json({
      success: true,
      count: outlets.length,
      data: outlets
    });
  } catch (error) {
    console.error('Get pending outlets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pending outlets'
    });
  }
};

/**
 * @desc    Create admin user (super admin only)
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isVerified: true
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating admin user'
    });
  }
};

/**
 * @desc    Get all products (admin view)
 * @route   GET /api/admin/products
 * @access  Private/Admin
 */
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate({
        path: 'outletId',
        select: 'name ownerId',
        populate: {
          path: 'ownerId',
          select: 'name email'
        }
      });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get all products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

/**
 * @desc    Update product (admin)
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Admin update product error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

/**
 * @desc    Delete product (admin)
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get outlet for this product
    const outlet = await Outlet.findById(product.outletId);
    if (outlet) {
      // Remove product from outlet's products array
      outlet.products = outlet.products.filter(
        id => id.toString() !== req.params.id
      );
      await outlet.save();
    }

    await product.remove();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete product error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};
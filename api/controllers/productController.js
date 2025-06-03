import Product from '../models/Product.js';
import Outlet from '../models/Outlet.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Create a new product
 * @route   POST /api/outlet/products
 * @access  Private/Outlet
 */
export const createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Get outlet for current user
    const outlet = await Outlet.findOne({ ownerId: req.user.id });
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'You must register an outlet before adding products'
      });
    }

    // Create product with outlet ID
    const product = await Product.create({
      ...req.body,
      outletId: outlet._id
    });

    // Add product to outlet's products array
    outlet.products.push(product._id);
    await outlet.save();

    return res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    // Build query
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Remove fields from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Product.find(JSON.parse(queryStr));

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/outlet/products/:id
 * @access  Private/Outlet
 */
export const updateProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get outlet for current user
    const outlet = await Outlet.findOne({ ownerId: req.user.id });
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Make sure user is product owner
    if (product.outletId.toString() !== outlet._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
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
    console.error('Update product error:', error);
    
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
 * @desc    Delete product
 * @route   DELETE /api/outlet/products/:id
 * @access  Private/Outlet
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

    // Get outlet for current user
    const outlet = await Outlet.findOne({ ownerId: req.user.id });
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Make sure user is product owner or admin
    if (product.outletId.toString() !== outlet._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.remove();

    // Remove product from outlet's products array
    outlet.products = outlet.products.filter(
      id => id.toString() !== req.params.id
    );
    await outlet.save();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    
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

/**
 * @desc    Get products for an outlet
 * @route   GET /api/outlets/:id/products
 * @access  Public
 */
export const getOutletProducts = async (req, res) => {
  try {
    const products = await Product.find({ outletId: req.params.id });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get outlet products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching outlet products'
    });
  }
};

/**
 * @desc    Get products for current outlet owner
 * @route   GET /api/outlet/products
 * @access  Private/Outlet
 */
export const getMyProducts = async (req, res) => {
  try {
    // Get outlet for current user
    const outlet = await Outlet.findOne({ ownerId: req.user.id });
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'You have no registered outlet'
      });
    }

    const products = await Product.find({ outletId: outlet._id });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get my products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your products'
    });
  }
};

/**
 * @desc    Add product review
 * @route   POST /api/products/:id/reviews
 * @access  Private/User
 */
export const addProductReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      review => review.userId.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Add review
    const review = {
      userId: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment
    };

    product.reviews.push(review);
    
    // Calculate average rating
    product.calculateAverageRating();
    
    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: product
    });
  } catch (error) {
    console.error('Add review error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while adding review'
    });
  }
};
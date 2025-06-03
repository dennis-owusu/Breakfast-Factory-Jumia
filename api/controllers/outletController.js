import Outlet from '../models/Outlet.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Create a new outlet
 * @route   POST /api/outlets
 * @access  Private/Outlet
 */
export const createOutlet = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, location, contact, description, logo } = req.body;

    // Check if user already has an outlet
    const existingOutlet = await Outlet.findOne({ ownerId: req.user.id });
    if (existingOutlet) {
      return res.status(400).json({
        success: false,
        message: 'You already have an outlet registered'
      });
    }

    // Create outlet
    const outlet = await Outlet.create({
      name,
      ownerId: req.user.id,
      location,
      contact,
      description,
      logo
    });

    return res.status(201).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    console.error('Create outlet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating outlet'
    });
  }
};

/**
 * @desc    Get all outlets
 * @route   GET /api/outlets
 * @access  Public
 */
export const getOutlets = async (req, res) => {
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
    query = Outlet.find(JSON.parse(queryStr));

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
    const total = await Outlet.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const outlets = await query;

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
      count: outlets.length,
      pagination,
      data: outlets
    });
  } catch (error) {
    console.error('Get outlets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching outlets'
    });
  }
};

/**
 * @desc    Get single outlet
 * @route   GET /api/outlets/:id
 * @access  Public
 */
export const getOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    console.error('Get outlet error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching outlet'
    });
  }
};

/**
 * @desc    Update outlet
 * @route   PUT /api/outlets/:id
 * @access  Private/Outlet
 */
export const updateOutlet = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    let outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Make sure user is outlet owner
    if (outlet.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this outlet'
      });
    }

    // Update outlet
    outlet = await Outlet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    console.error('Update outlet error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while updating outlet'
    });
  }
};

/**
 * @desc    Delete outlet
 * @route   DELETE /api/outlets/:id
 * @access  Private/Outlet
 */
export const deleteOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Make sure user is outlet owner or admin
    if (outlet.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this outlet'
      });
    }

    await outlet.remove();

    return res.status(200).json({
      success: true,
      message: 'Outlet deleted successfully'
    });
  } catch (error) {
    console.error('Delete outlet error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting outlet'
    });
  }
};

/**
 * @desc    Get outlets for current user (outlet owner)
 * @route   GET /api/outlets/my
 * @access  Private/Outlet
 */
export const getMyOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findOne({ ownerId: req.user.id });

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'You have no registered outlet'
      });
    }

    return res.status(200).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    console.error('Get my outlet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching outlet'
    });
  }
};

/**
 * @desc    Verify outlet (admin only)
 * @route   PUT /api/admin/outlets/:id/verify
 * @access  Private/Admin
 */
export const verifyOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Update verification status
    outlet.isVerified = true;
    await outlet.save();

    return res.status(200).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    console.error('Verify outlet error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying outlet'
    });
  }
};

export const getOutletProducts = async (req, res) => {
  
}
export const getAllOutlets = async (req, res) => {
  
}
export const getPendingOutlets = async (req, res) => {
  
}
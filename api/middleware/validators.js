import { check } from 'express-validator';

// User registration validation
export const registerValidator = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('role')
    .optional()
    .isIn(['user', 'outlet'])
    .withMessage('Role must be either user or outlet')
];

// User login validation
export const loginValidator = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Update profile validation
export const updateProfileValidator = [
  check('name', 'Name is required').optional().not().isEmpty(),
  check('email', 'Please include a valid email').optional().isEmail()
];

// Update password validation
export const updatePasswordValidator = [
  check('currentPassword', 'Current password is required').not().isEmpty(),
  check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
];

// Outlet validation
export const outletValidator = [
  check('name', 'Outlet name is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty(),
  check('contact.phone', 'Contact phone is required').not().isEmpty(),
  check('contact.email', 'Contact email must be valid').isEmail()
];

// Product validation
export const productValidator = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('price', 'Price must be a positive number').isFloat({ min: 0 }),
  check('stock', 'Stock must be a non-negative integer').isInt({ min: 0 }),
  check('category', 'Category is required').not().isEmpty(),
  check('images', 'At least one image is required').isArray({ min: 1 })
];

// Review validation
export const reviewValidator = [
  check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
  check('comment', 'Comment is required').not().isEmpty()
];

// Admin user creation validation
export const adminUserValidator = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];
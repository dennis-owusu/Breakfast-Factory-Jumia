import express from 'express';
const router = express.Router();
import { 
  getUsers, 
  getUserById, 
  deleteUser, 
  updateUserRole 
} from '../controllers/userController.js';
import { 
  verifyOutlet, 
  getAllOutlets, 
  getPendingOutlets 
} from '../controllers/outletController.js';
import { 
  getDashboardStats, 
  createAdminUser, 
  getAllProducts, 
  updateProduct, 
  deleteProduct 
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { adminUserValidator } from '../middleware/validators.js';

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', getDashboardStats);

// User management
router.route('/users')
  .get(getUsers)
  .post(adminUserValidator, createAdminUser);

router.route('/users/:id')
  .get(getUserById)
  .delete(deleteUser);

router.put('/users/:id/role', updateUserRole);

// Outlet management
router.get('/outlets', getAllOutlets);
router.get('/outlets/pending', getPendingOutlets);
router.put('/outlets/:id/verify', verifyOutlet);

// Product management
router.get('/products', getAllProducts);
router.route('/products/:id')
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
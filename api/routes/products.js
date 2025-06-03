import express from 'express';
const router = express.Router();
import { 
  getProducts, 
  getProduct, 
  addProductReview,
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getMyProducts 
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { 
  productValidator, 
  reviewValidator 
} from '../middleware/validators.js';

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes
router.post('/:id/reviews', protect, authorize('user'), reviewValidator, addProductReview);

// Outlet owner routes
router.route('/outlet')
  .get(protect, authorize('outlet'), getMyProducts)
  .post(protect, authorize('outlet'), productValidator, createProduct);

router.route('/outlet/:id')
  .put(protect, authorize('outlet'), productValidator, updateProduct)
  .delete(protect, authorize('outlet'), deleteProduct);

export default router;
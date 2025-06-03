import express from 'express';
const router = express.Router();
import { 
  createOutlet, 
  getOutlets, 
  getOutlet, 
  updateOutlet, 
  deleteOutlet, 
  getMyOutlet,
  getOutletProducts
} from '../controllers/outletController.js';
import { protect, authorize } from '../middleware/auth.js';
import { outletValidator } from '../middleware/validators.js';

// Public routes
router.get('/', getOutlets);
router.get('/:id', getOutlet);
router.get('/:id/products', getOutletProducts);

// Protected routes for outlet owners
router.use(protect);
router.post('/', authorize('outlet'), outletValidator, createOutlet);
router.get('/my/outlet', authorize('outlet'), getMyOutlet);
router.put('/:id', authorize('outlet', 'admin'), outletValidator, updateOutlet);
router.delete('/:id', authorize('outlet', 'admin'), deleteOutlet);

export default router;
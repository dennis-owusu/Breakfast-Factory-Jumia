import express from 'express';
const router = express.Router();
import { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  updateOrderStatus,
  verifyPaystackPayment,
  paystackWebhook
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { orderValidator } from '../middleware/validators.js';

// Public routes
router.get('/verify-payment/:reference', verifyPaystackPayment);
router.post('/paystack-webhook', paystackWebhook);

// Protected routes
router.route('/')
  .post(protect, orderValidator, createOrder)
  .get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/status')
  .put(protect, authorize('admin', 'outlet'), updateOrderStatus);

export default router;
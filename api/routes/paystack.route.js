import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
  initializePayment,
  verifyPayment,
  handleWebhook,
} from '../controllers/paystack.controller.js';

const router = express.Router();

// Initialize Paystack payment
router.post('/initialize', verifyToken, initializePayment);

// Verify Paystack payment
router.get('/verify', verifyPayment);

// Paystack webhook (public endpoint - no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;

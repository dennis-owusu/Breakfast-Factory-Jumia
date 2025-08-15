import express from 'express';
import {
  createSubscription,
  getSubscriptionByUserId,
  cancelSubscription,
  renewSubscription,
  upgradeSubscription,
  getAllSubscriptions
} from '../controllers/subscription.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';

const router = express.Router();

// Create a new subscription
router.post('/subscription', createSubscription);

// Get subscription by user ID
router.get('/subscription/user/:userId', getSubscriptionByUserId);

// Cancel subscription
router.put('/subscription/cancel/:subscriptionId', cancelSubscription);

// Renew subscription
router.put('/subscription/renew', renewSubscription);

// Upgrade subscription from free to pro
router.put('/subscription/upgrade', upgradeSubscription);

// Get all subscriptions (admin only)
router.get('/subscriptions', verifyAdmin, getAllSubscriptions);

export default router;
import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
  createSubscription,
  getSubscriptionByUserId,
  cancelSubscription,
  renewSubscription,
  upgradeSubscription,
  getAllSubscriptions
} from '../controllers/subscription.controller.js';

const router = express.Router();

// Create a new subscription
router.post('/subscription', verifyToken, createSubscription);

// Get subscription by user ID
router.get('/subscription/user/:userId', verifyToken, getSubscriptionByUserId);

// Cancel subscription
router.put('/subscription/cancel/:subscriptionId', verifyToken, cancelSubscription);

// Renew subscription
router.put('/subscription/renew', verifyToken, renewSubscription);

// Upgrade subscription from free to pro
router.put('/subscription/upgrade', verifyToken, upgradeSubscription);

// Get all subscriptions (admin only)
router.get('/subscriptions', verifyToken, getAllSubscriptions);

export default router;
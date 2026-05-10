import express from 'express';
import {
  createSubscription,
  getSubscriptionByUserId,
  cancelSubscription,
  renewSubscription,
  upgradeSubscription,
  getAllSubscriptions,
  checkSubscriptionStatus
} from '../controllers/subscription.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';

const router = express.Router();

// Create a new subscription
router.post('/subscription', verifyToken, createSubscription);

// Get subscription by user ID - real-time check (OPTIONAL - doesn't block)
router.get('/subscription/user/:userId', verifyToken, getSubscriptionByUserId);

// Check subscription status (real-time endpoint) (OPTIONAL - doesn't block)
router.get('/subscription/check/:userId', verifyToken, checkSubscriptionStatus);

// Cancel subscription
router.put('/subscription/cancel/:subscriptionId', verifyToken, cancelSubscription);

// Renew subscription
router.put('/subscription/renew', verifyToken, renewSubscription);

// Upgrade subscription from free to pro
router.put('/subscription/upgrade', verifyToken, upgradeSubscription);

// Get all subscriptions (admin only)
router.get('/subscriptions', verifyAdmin, getAllSubscriptions);

export default router;

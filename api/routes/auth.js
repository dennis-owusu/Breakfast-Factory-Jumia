import express from 'express';
const router = express.Router();
import { 
  register, 
  login, 
  logout, 
  getMe 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { 
  registerValidator, 
  loginValidator 
} from '../middleware/validators.js';

// Public routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

export default router;
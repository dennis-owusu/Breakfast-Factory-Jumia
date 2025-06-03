import express from 'express';
const router = express.Router();
import { 
  updateProfile, 
  updatePassword 
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { 
  updateProfileValidator, 
  updatePasswordValidator 
} from '../middleware/validators.js';

// All routes are protected
router.use(protect);

// User routes
router.put('/profile', updateProfileValidator, updateProfile);
router.put('/password', updatePasswordValidator, updatePassword);

export default router;
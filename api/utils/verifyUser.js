import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';
import Subscription from '../models/subscription.model.js';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return next(errorHandler(401, 'Unauthorized'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(errorHandler(401, 'Unauthorized'));
    }
    req.user = user;
    next();
  });
};

// In verifyAdmin

export const verifyAdmin = async(req, res, next) =>{

    if (req.user.role === 'admin') {
      const subscription = await Subscription.findOne({ userId: req.user.id, status: 'active' });
      if (!subscription || new Date() > subscription.endDate) {
        return next(errorHandler(403, 'Subscription expired. Please renew to access admin features.'));
      }
      next();
    } else {
      return next(errorHandler(403, 'Only admins can perform this action'));
    }

}

export const verifyOutlet = async(req, res, next) => {
  // Similarly for verifyOutlet

    if (req.user.role === 'outlet') {
      const subscription = await Subscription.findOne({ userId: req.user.id, status: 'active' });
      if (!subscription || new Date() > subscription.endDate) {
        return next(errorHandler(403, 'Subscription expired. Please renew to access outlet features.'));
      }
      next();
    } else {
      return next(errorHandler(403, 'Only outlets can perform this action'));
    }

};
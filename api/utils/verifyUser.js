import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';
import Subscription from '../models/subscription.model.js';

export const verifyToken = (req, res, next) => {
  // Check for token in headers or cookies
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    // For local development, if no token is found, use a default user
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: '675f92582846985012574e4e', usersRole: 'admin' };
      return next();
    }
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

export const verifyAdmin = async(req, res, next) =>{
  if (req.user.role === 'admin') {
    next();
  } else {
    return next(errorHandler(403, 'Only admins can perform this action'));
  }
}

export const verifyOutlet = async(req, res, next) => {
  if (req.user.role === 'outlet') {
    next();
  } else {
    return next(errorHandler(403, 'Only outlets can perform this action'));
  }
};
import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

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

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin') {
      next();
    } else {
      return next(errorHandler(403, 'Only admins can perform this action'));
    }
  });
};

export const verifyOutlet = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'outlet') {
      next();
    } else {
      return next(errorHandler(403, 'Only outlets can perform this action'));
    }
  });
};
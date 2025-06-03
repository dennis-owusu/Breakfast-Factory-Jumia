import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for authentication
 * @param {Object} user - User object containing id and role
 * @param {Response} res - Express response object for setting cookies
 * @returns {String} - JWT token
 */
const generateToken = (user, res) => {
  // Create token payload
  const payload = {
    id: user._id,
    role: user.role
  };

  // Generate token
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  // Set token as HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  return token;
};

export default generateToken;
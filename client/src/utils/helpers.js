/**
 * Format price to currency format
 * @param {number} price - The price to format
 * @param {string} currency - The currency symbol (default: ₵)
 * @returns {string} Formatted price
 */
export const formatPrice = (price, currency = '₵') => {
  if (price === undefined || price === null) return `${currency}0.00`;
  return `${currency}${parseFloat(price).toFixed(2)}`;
};

export const pdfFormatPrice = (price) => {
  if (price === undefined || price === null) return 'GHS 0.00';
  return `GHS ${parseFloat(price).toFixed(2)}`;
};

/**
 * Format date to readable format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - The original price
 * @param {number} discountedPrice - The discounted price
 * @returns {number} Discount percentage
 */
export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice) return 0;
  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
};

/**
 * Generate array of page numbers for pagination
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @param {number} maxPageNumbers - Maximum number of page buttons to show
 * @returns {Array} Array of page numbers to display
 */
export const generatePagination = (currentPage, totalPages, maxPageNumbers = 5) => {
  if (totalPages <= maxPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfWay = Math.floor(maxPageNumbers / 2);
  const isStartPage = currentPage <= halfWay;
  const isEndPage = currentPage > totalPages - halfWay;

  if (isStartPage) {
    return Array.from({ length: maxPageNumbers }, (_, i) => i + 1);
  }

  if (isEndPage) {
    return Array.from(
      { length: maxPageNumbers },
      (_, i) => totalPages - maxPageNumbers + i + 1
    );
  }

  return Array.from(
    { length: maxPageNumbers },
    (_, i) => currentPage - halfWay + i
  );
};

/**
 * Get average rating from reviews
 * @param {Array} reviews - Array of review objects with rating property
 * @returns {number} Average rating
 */
export const getAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  
  // Check for at least one uppercase letter, one lowercase letter, and one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Get user role display name
 * @param {string} role - User role (admin, outlet, user)
 * @returns {string} Display name for role
 */
export const getRoleDisplayName = (role) => {
  const roleMap = {
    admin: 'Administrator',
    outlet: 'Outlet Owner',
    user: 'Customer'
  };
  
  return roleMap[role] || 'Customer';
};

/**
 * Get order status display information
 * @param {string} status - Order status
 * @returns {Object} Status display info with label, color, and bgColor
 */
export const getOrderStatusInfo = (status) => {
  const statusMap = {
    pending: {
      label: 'Pending',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    },
    processing: {
      label: 'Processing',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100'
    },
    shipped: {
      label: 'Shipped',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100'
    },
    delivered: {
      label: 'Delivered',
      color: 'text-green-700',
      bgColor: 'bg-green-100'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-700',
      bgColor: 'bg-red-100'
    }
  };
  
  return statusMap[status] || {
    label: status,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  };
};
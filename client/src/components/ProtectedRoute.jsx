import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute component for role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {Array<string>} props.allowedRoles - Array of roles allowed to access this route
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {string} props.userRole - The role of the current user
 * @param {string} props.redirectPath - Path to redirect to if unauthorized
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  isAuthenticated = false,
  userRole = '',
  redirectPath = '/login'
}) => {
  const location = useLocation();

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If allowedRoles is empty or user's role is in allowedRoles, render children
  if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
    return children;
  }

  // If user's role is not allowed, redirect based on their role
  let redirectTo = '/';
  
  switch (userRole) {
    case 'admin':
      redirectTo = '/admin/dashboard';
      break;
    case 'outlet':
      redirectTo = '/outlet/dashboard';
      break;
    case 'user':
      redirectTo = '/profile';
      break;
    default:
      redirectTo = '/';
  }

  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This will be replaced with Redux state
  const [userRole, setUserRole] = useState('user'); // This will be replaced with Redux state
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-orange-500">Breakfast Factory</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <Link to="/products" className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium">
              Products
            </Link>
            
            <Link to="/cart" className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                0
              </span>
            </Link>
            
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium">
                  <User className="h-6 w-6 mr-1" />
                  <span>Account</span>
                </button>
                <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-xl hidden group-hover:block">
                  {userRole === 'admin' && (
                    <Link to="/admin/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                      Admin Dashboard
                    </Link>
                  )}
                  {userRole === 'outlet' && (
                    <Link to="/outlet/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                      Outlet Dashboard
                    </Link>
                  )}
                  <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                    My Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                    My Orders
                  </Link>
                  <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-orange-500 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-600">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-orange-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border rounded-full w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <Link 
              to="/products" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            
            <Link 
              to="/cart" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              <span className="ml-2 bg-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                0
              </span>
            </Link>
            
            {isLoggedIn ? (
              <>
                {userRole === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                {userRole === 'outlet' && (
                  <Link 
                    to="/outlet/dashboard" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Outlet Dashboard
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link 
                  to="/orders" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Orders
                </Link>
                <button 
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-orange-500 text-white hover:bg-orange-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
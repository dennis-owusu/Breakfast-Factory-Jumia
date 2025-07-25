import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { signoutSuccess } from '../redux/slices/authSlice';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    // Clear user data from Redux store
    dispatch(signoutSuccess());
    navigate('/');
  };

  // Calculate total items in cart
  const cartItemCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;

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
                {cartItemCount}
              </span>
            </Link>
            
            {currentUser ? (
              <div className="relative group">
                <button className="flex items-center text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium">
                  <User className="h-6 w-6 mr-1" />
                  <span>{currentUser.name || 'Account'}</span>
                </button>
                <div className="absolute right-0 w-48 mt-0 py-2 bg-white rounded-md shadow-xl hidden group-hover:block">
                  {currentUser.usersRole === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                        Admin Dashboard
                      </Link>
                      <Link to="/admin/subscription" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                        Subscription
                      </Link>
                    </>
                  )}
                  {currentUser.usersRole === 'outlet' && (
                    <>
                      <Link to="/outlet/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                        Outlet Dashboard
                      </Link>
                      <Link to="/outlet/subscription" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                        Subscription
                      </Link>
                    </>
                  )}
                  <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                    My Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white">
                    My Orders
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-orange-500 hover:text-white flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
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
                {cartItemCount}
              </span>
            </Link>
            
            {currentUser ? (
              <>
                {currentUser.usersRole === 'admin' && (
                  <>
                    <Link 
                      to="/admin/dashboard" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                    <Link 
                      to="/admin/subscription" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Subscription
                    </Link>
                  </>
                )}
                {currentUser.usersRole === 'outlet' && (
                  <>
                    <Link 
                      to="/outlet/dashboard" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Outlet Dashboard
                    </Link>
                    <Link 
                      to="/outlet/subscription" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Subscription
                    </Link>
                  </>
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
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 flex items-center"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
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
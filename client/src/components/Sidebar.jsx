import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ links, title = 'Menu', isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 md:hidden transition-opacity duration-300" 
          onClick={onClose}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`w-64 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30 h-full fixed top-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors duration-200">
          <h2 className="text-xl font-bold text-orange-500 dark:text-orange-400 transition-colors duration-200">
            {title}
          </h2>
          <button 
            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto bg-white dark:bg-gray-800 transition-colors duration-200">
          {links.map((link) => {
            const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 shadow-sm border border-orange-200 dark:border-orange-800'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-sm hover:border hover:border-orange-100 dark:hover:border-orange-800'
                }`}
                onClick={() => window.innerWidth < 768 && onClose()}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 dark:bg-orange-400 rounded-r-full transition-colors duration-200"></div>
                )}
                
                <span className={`mr-3 transition-colors duration-200 ${
                  isActive 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-500 dark:group-hover:text-orange-400'
                }`}>
                  {link.icon}
                </span>
                
                <span className="transition-colors duration-200">
                  {link.label}
                </span>

                {/* Subtle hover effect */}
                <div className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${
                  isActive 
                    ? 'opacity-0' 
                    : 'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/10'
                }`}></div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Optional - for branding or additional info) */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-200">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>System Active</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
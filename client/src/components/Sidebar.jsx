import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ links, title = 'Menu' }) => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg h-full fixed top-0 left-0 z-30 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-orange-500">{title}</h2>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`group flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-150 ${
                isActive
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar; 
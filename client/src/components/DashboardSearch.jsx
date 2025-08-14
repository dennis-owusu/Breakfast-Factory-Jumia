import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Package, ShoppingBag, Users, BarChart2, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const DashboardSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const role = currentUser?.usersRole || 'user';

  const searchCategories = [
    { id: 'all', label: 'All', icon: <Search size={16} /> },
    { id: 'products', label: 'Products', icon: <Package size={16} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
  ];

  const suggestions = [
    'Low stock products',
    'Recent orders',
    'Monthly sales',
    'Top customers',
    'Pending deliveries',
    'Revenue this week',
  ];

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when search is opened
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Command+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 2) {
      setIsLoading(true);
      // Simulate API call delay
      const timeoutId = setTimeout(() => {
        fetchSearchResults(value);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else if (value.length === 0) {
      setSearchResults({});
    }
  };

  const fetchSearchResults = async (query) => {
    try {
      // In a real implementation, this would be an API call to the backend
      // For now, we'll simulate results based on the role
      
      // Simulate different results based on the selected category
      let results = {};
      
      // Products search simulation
      if (selectedCategory === 'all' || selectedCategory === 'products') {
        results.products = [
          { id: 1, name: 'Smartphone X', price: 599.99, stock: 45, category: 'Electronics', image: 'https://via.placeholder.com/50' },
          { id: 2, name: 'Wireless Headphones', price: 129.99, stock: 32, category: 'Electronics', image: 'https://via.placeholder.com/50' },
          { id: 3, name: 'Smart Watch', price: 199.99, stock: 18, category: 'Electronics', image: 'https://via.placeholder.com/50' },
        ].filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Orders search simulation
      if (selectedCategory === 'all' || selectedCategory === 'orders') {
        results.orders = [
          { id: 'ORD-1234', customer: 'John Doe', date: '2023-05-15', total: 729.98, status: 'Delivered' },
          { id: 'ORD-1235', customer: 'Jane Smith', date: '2023-05-16', total: 199.99, status: 'Processing' },
          { id: 'ORD-1236', customer: 'Robert Johnson', date: '2023-05-17', total: 349.97, status: 'Shipped' },
        ].filter(order => 
          order.id.toLowerCase().includes(query.toLowerCase()) ||
          order.customer.toLowerCase().includes(query.toLowerCase()) ||
          order.status.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Customers search simulation
      if (selectedCategory === 'all' || selectedCategory === 'customers') {
        results.customers = [
          { id: 1, name: 'John Doe', email: 'john@example.com', orders: 5, totalSpent: 1245.87 },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', orders: 3, totalSpent: 567.50 },
          { id: 3, name: 'Robert Johnson', email: 'robert@example.com', orders: 7, totalSpent: 2134.99 },
        ].filter(customer => 
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.email.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Analytics search simulation
      if (selectedCategory === 'all' || selectedCategory === 'analytics') {
        results.analytics = [
          { id: 1, title: 'Monthly Sales Report', period: 'May 2023', growth: '+15%', type: 'report' },
          { id: 2, title: 'Product Performance', period: 'Q2 2023', growth: '+8%', type: 'dashboard' },
          { id: 3, title: 'Customer Retention', period: 'Last 6 months', growth: '+5%', type: 'analysis' },
        ].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.period.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      setSearchResults(results);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setIsLoading(false);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === '') return;
    
    // Navigate to appropriate page based on selected category
    setIsSearchOpen(false);
    
    if (role === 'outlet') {
      switch (selectedCategory) {
        case 'products':
          navigate(`/outlet/products?search=${searchTerm}`);
          break;
        case 'orders':
          navigate(`/outlet/orders?search=${searchTerm}`);
          break;
        case 'customers':
          // Assuming there's a customers page
          navigate(`/outlet/customers?search=${searchTerm}`);
          break;
        case 'analytics':
          navigate(`/outlet/analytics?query=${searchTerm}`);
          break;
        default:
          // For 'all', navigate to a search results page or dashboard
          navigate(`/outlet/dashboard?search=${searchTerm}`);
      }
    } else if (role === 'admin') {
      switch (selectedCategory) {
        case 'products':
          navigate(`/admin/products?search=${searchTerm}`);
          break;
        case 'orders':
          navigate(`/admin/orders?search=${searchTerm}`);
          break;
        case 'customers':
          navigate(`/admin/users?search=${searchTerm}`);
          break;
        case 'analytics':
          navigate(`/admin/analytics?query=${searchTerm}`);
          break;
        default:
          navigate(`/admin/dashboard?search=${searchTerm}`);
      }
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    fetchSearchResults(suggestion);
  };
  
  const handleResultClick = (result, type) => {
    setIsSearchOpen(false);
    
    // Navigate to the appropriate detail page based on result type
    if (role === 'outlet') {
      switch (type) {
        case 'product':
          navigate(`/outlet/products/${result.id}`);
          break;
        case 'order':
          navigate(`/outlet/orders/${result.id}`);
          break;
        case 'customer':
          // Assuming there's a customer detail page
          navigate(`/outlet/customers/${result.id}`);
          break;
        case 'analytics':
          navigate(`/outlet/analytics?report=${result.title}`);
          break;
      }
    } else if (role === 'admin') {
      switch (type) {
        case 'product':
          navigate(`/admin/products/${result.id}`);
          break;
        case 'order':
          navigate(`/admin/orders/${result.id}`);
          break;
        case 'customer':
          navigate(`/admin/users/${result.id}`);
          break;
        case 'analytics':
          navigate(`/admin/analytics?report=${result.title}`);
          break;
      }
    }
  };
  
  const renderResultItem = (result, type) => {
    switch (type) {
      case 'product':
        return (
          <div 
            key={result.id} 
            className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => handleResultClick(result, 'product')}
          >
            <div className="h-10 w-10 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0">
              <img src={result.image} alt={result.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 mr-2">{result.category}</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                  ${result.price.toFixed(2)}
                </span>
                <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${result.stock < 20 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {result.stock} in stock
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </div>
        );
        
      case 'order':
        return (
          <div 
            key={result.id} 
            className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => handleResultClick(result, 'order')}
          >
            <div className="h-10 w-10 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <ShoppingBag size={20} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{result.id}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 mr-2">{result.customer}</span>
                <span className="text-xs text-gray-500 mr-2">{result.date}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${result.status === 'Delivered' ? 'bg-green-100 text-green-800' : result.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {result.status}
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">${result.total.toFixed(2)}</div>
            <ArrowRight size={16} className="ml-2 text-gray-400" />
          </div>
        );
        
      case 'customer':
        return (
          <div 
            key={result.id} 
            className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => handleResultClick(result, 'customer')}
          >
            <div className="h-10 w-10 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <Users size={20} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 mr-2">{result.email}</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {result.orders} orders
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">${result.totalSpent.toFixed(2)}</div>
            <ArrowRight size={16} className="ml-2 text-gray-400" />
          </div>
        );
        
      case 'analytics':
        return (
          <div 
            key={result.id} 
            className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => handleResultClick(result, 'analytics')}
          >
            <div className="h-10 w-10 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <BarChart2 size={20} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 mr-2">{result.period}</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                  {result.growth}
                </span>
                <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {result.type}
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search trigger button */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Search"
      >
        <Search size={20} />
      </button>
      
      {/* Search modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-start justify-center pt-16 px-4 sm:px-6 md:px-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Search header */}
            <div className="p-4 border-b border-gray-200">
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search for anything..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <X size={20} />
                </button>
              </form>
              
              {/* Search categories */}
              <div className="flex items-center space-x-2 mt-3 overflow-x-auto pb-2">
                {searchCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${selectedCategory === category.id ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <span className="mr-1.5">{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Search content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Loading state */}
              {isLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              )}
              
              {/* Empty state with suggestions */}
              {!isLoading && searchTerm.length < 3 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Suggestions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <Clock size={16} className="mr-2 text-gray-400" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Results */}
              {!isLoading && searchTerm.length >= 3 && (
                <div className="space-y-6">
                  {/* No results state */}
                  {Object.keys(searchResults).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No results found for "{searchTerm}"</p>
                    </div>
                  )}
                  
                  {/* Products results */}
                  {searchResults.products && searchResults.products.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Products</h3>
                        {searchResults.products.length > 3 && (
                          <button 
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/${role}/products?search=${searchTerm}`);
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800"
                          >
                            View all
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {searchResults.products.slice(0, 3).map(product => renderResultItem(product, 'product'))}
                      </div>
                    </div>
                  )}
                  
                  {/* Orders results */}
                  {searchResults.orders && searchResults.orders.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Orders</h3>
                        {searchResults.orders.length > 3 && (
                          <button 
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/${role}/orders?search=${searchTerm}`);
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800"
                          >
                            View all
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {searchResults.orders.slice(0, 3).map(order => renderResultItem(order, 'order'))}
                      </div>
                    </div>
                  )}
                  
                  {/* Customers results */}
                  {searchResults.customers && searchResults.customers.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Customers</h3>
                        {searchResults.customers.length > 3 && (
                          <button 
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/${role === 'admin' ? 'admin/users' : 'outlet/customers'}?search=${searchTerm}`);
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800"
                          >
                            View all
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {searchResults.customers.slice(0, 3).map(customer => renderResultItem(customer, 'customer'))}
                      </div>
                    </div>
                  )}
                  
                  {/* Analytics results */}
                  {searchResults.analytics && searchResults.analytics.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Analytics</h3>
                        {searchResults.analytics.length > 3 && (
                          <button 
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/${role}/analytics?query=${searchTerm}`);
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800"
                          >
                            View all
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {searchResults.analytics.slice(0, 3).map(item => renderResultItem(item, 'analytics'))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Search footer */}
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
              <div>
                Press <kbd className="px-2 py-1 bg-white rounded border border-gray-300 shadow-sm">ESC</kbd> to close
              </div>
              <div>
                Press <kbd className="px-2 py-1 bg-white rounded border border-gray-300 shadow-sm">Enter</kbd> to search
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSearch;
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Package, ShoppingBag, Users, Store, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const DashboardSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  
  // Categories for search
  const categories = [
    { id: 'all', label: 'All', icon: <Search className="h-4 w-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
  ];

  // Common search suggestions
  const commonSuggestions = {
    all: ['recent orders', 'low stock products', 'top selling products', 'monthly sales'],
    products: ['out of stock', 'low inventory', 'add new product', 'product categories'],
    orders: ['pending orders', 'delivered orders', 'cancelled orders', 'order #'],
    customers: ['new customers', 'top customers', 'customer feedback'],
    analytics: ['sales report', 'revenue growth', 'product performance', 'customer acquisition']
  };

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

  // Update suggestions based on category and search term
  useEffect(() => {
    if (!searchTerm) {
      setSuggestions(commonSuggestions[selectedCategory] || []);
      return;
    }

    // Filter suggestions based on search term
    const filtered = commonSuggestions[selectedCategory]?.filter(suggestion => 
      suggestion.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    setSuggestions(filtered);
  }, [searchTerm, selectedCategory]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 0) {
      setIsLoading(true);
      // Simulate API call for search results
      setTimeout(() => {
        fetchSearchResults(value, selectedCategory);
        setIsLoading(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  // Fetch search results based on term and category
  const fetchSearchResults = (term, category) => {
    // This would be replaced with actual API calls
    // For now, we'll simulate results
    let results = [];
    
    if (category === 'all' || category === 'products') {
      results.push(
        { id: 'p1', type: 'product', name: 'Smartphone XYZ', category: 'Electronics', stock: 25, price: '$599' },
        { id: 'p2', type: 'product', name: 'Laptop Pro', category: 'Electronics', stock: 10, price: '$1299' },
        { id: 'p3', type: 'product', name: 'Wireless Headphones', category: 'Electronics', stock: 50, price: '$99' }
      );
    }
    
    if (category === 'all' || category === 'orders') {
      results.push(
        { id: 'o1', type: 'order', number: 'ORD-12345', customer: 'John Doe', date: '2023-05-15', status: 'Delivered', total: '$899' },
        { id: 'o2', type: 'order', number: 'ORD-12346', customer: 'Jane Smith', date: '2023-05-16', status: 'Processing', total: '$1499' }
      );
    }
    
    if (category === 'all' || category === 'customers') {
      results.push(
        { id: 'c1', type: 'customer', name: 'John Doe', email: 'john@example.com', orders: 5, spent: '$2500' },
        { id: 'c2', type: 'customer', name: 'Jane Smith', email: 'jane@example.com', orders: 3, spent: '$1800' }
      );
    }
    
    if (category === 'all' || category === 'analytics') {
      results.push(
        { id: 'a1', type: 'analytics', name: 'Monthly Sales Report', period: 'May 2023', growth: '+15%' },
        { id: 'a2', type: 'analytics', name: 'Product Performance', period: 'Q2 2023', topProduct: 'Smartphone XYZ' }
      );
    }
    
    // Filter results based on search term
    results = results.filter(item => {
      if (item.type === 'product') {
        return item.name.toLowerCase().includes(term.toLowerCase()) || 
               item.category.toLowerCase().includes(term.toLowerCase());
      } else if (item.type === 'order') {
        return item.number.toLowerCase().includes(term.toLowerCase()) || 
               item.customer.toLowerCase().includes(term.toLowerCase()) ||
               item.status.toLowerCase().includes(term.toLowerCase());
      } else if (item.type === 'customer') {
        return item.name.toLowerCase().includes(term.toLowerCase()) || 
               item.email.toLowerCase().includes(term.toLowerCase());
      } else if (item.type === 'analytics') {
        return item.name.toLowerCase().includes(term.toLowerCase()) || 
               item.period.toLowerCase().includes(term.toLowerCase());
      }
      return false;
    });
    
    setSearchResults(results);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    
    // Navigate based on category and search term
    if (selectedCategory === 'products' || 
        (selectedCategory === 'all' && searchResults.some(r => r.type === 'product'))) {
      navigate(`/outlet/products?search=${encodeURIComponent(searchTerm)}`);
    } else if (selectedCategory === 'orders' || 
               (selectedCategory === 'all' && searchResults.some(r => r.type === 'order'))) {
      navigate(`/outlet/orders?search=${encodeURIComponent(searchTerm)}`);
    } else if (selectedCategory === 'customers') {
      // Assuming there's a customers page
      navigate(`/outlet/customers?search=${encodeURIComponent(searchTerm)}`);
    } else if (selectedCategory === 'analytics') {
      navigate(`/outlet/analytics?report=${encodeURIComponent(searchTerm)}`);
    } else {
      // Default to products search
      navigate(`/outlet/products?search=${encodeURIComponent(searchTerm)}`);
    }
    
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    fetchSearchResults(suggestion, selectedCategory);
  };

  // Handle result click
  const handleResultClick = (result) => {
    switch(result.type) {
      case 'product':
        navigate(`/outlet/products/${result.id}`);
        break;
      case 'order':
        navigate(`/outlet/orders/${result.id}`);
        break;
      case 'customer':
        navigate(`/outlet/customers/${result.id}`);
        break;
      case 'analytics':
        navigate(`/outlet/analytics?report=${encodeURIComponent(result.name)}`);
        break;
      default:
        break;
    }
    
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  // Render result item based on type
  const renderResultItem = (result) => {
    switch(result.type) {
      case 'product':
        return (
          <div className="flex justify-between items-center w-full">
            <div>
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-gray-500">{result.category} • Stock: {result.stock}</div>
            </div>
            <div className="text-orange-600 font-medium">{result.price}</div>
          </div>
        );
      case 'order':
        return (
          <div className="flex justify-between items-center w-full">
            <div>
              <div className="font-medium">{result.number}</div>
              <div className="text-sm text-gray-500">{result.customer} • {result.date}</div>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs ${result.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {result.status}
              </span>
              <span className="ml-3 text-orange-600 font-medium">{result.total}</span>
            </div>
          </div>
        );
      case 'customer':
        return (
          <div className="flex justify-between items-center w-full">
            <div>
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-gray-500">{result.email}</div>
            </div>
            <div className="text-gray-600">
              <span className="text-sm">{result.orders} orders</span>
              <span className="ml-2 text-orange-600 font-medium">{result.spent}</span>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex justify-between items-center w-full">
            <div>
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-gray-500">{result.period}</div>
            </div>
            {result.growth && (
              <div className="text-green-600 font-medium">{result.growth}</div>
            )}
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
        className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 w-full max-w-xl"
      >
        <Search className="h-5 w-5 text-gray-400" />
        <span className="text-gray-500 text-sm">Search for anything...</span>
        <div className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">⌘K</div>
      </button>

      {/* Search modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsSearchOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white">
                {/* Search header */}
                <div className="border-b">
                  <div className="flex items-center px-4 py-3">
                    <Search className="h-5 w-5 text-gray-400" />
                    <form onSubmit={handleSearchSubmit} className="flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search for anything..."
                        className="w-full px-3 py-1 text-base focus:outline-none"
                        autoFocus
                      />
                    </form>
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                      className={`mr-2 ${!searchTerm ? 'invisible' : ''}`}
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                    <button onClick={() => setIsSearchOpen(false)}>
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>

                  {/* Category filters */}
                  <div className="flex space-x-1 px-4 pb-3 overflow-x-auto">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm ${selectedCategory === category.id ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {category.icon}
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search content */}
                <div className="max-h-96 overflow-y-auto">
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {!isLoading && searchTerm === '' && suggestions.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Suggestions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Search className="h-4 w-4 text-gray-400" />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search results */}
                  {!isLoading && searchTerm !== '' && (
                    <div className="p-4">
                      {searchResults.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No results found for "{searchTerm}"</p>
                          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter to find what you're looking for.</p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Results ({searchResults.length})
                          </h3>
                          <div className="space-y-4">
                            {/* Group results by type */}
                            {['product', 'order', 'customer', 'analytics'].map(type => {
                              const typeResults = searchResults.filter(r => r.type === type);
                              if (typeResults.length === 0) return null;
                              
                              return (
                                <div key={type} className="space-y-2">
                                  <h4 className="text-xs font-medium text-gray-500 capitalize">{type}s</h4>
                                  <div className="space-y-2">
                                    {typeResults.map(result => (
                                      <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="flex items-center space-x-3 p-3 w-full text-left hover:bg-gray-50 rounded-lg transition-colors duration-150"
                                      >
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                          {type === 'product' && <Package className="h-5 w-5" />}
                                          {type === 'order' && <ShoppingBag className="h-5 w-5" />}
                                          {type === 'customer' && <Users className="h-5 w-5" />}
                                          {type === 'analytics' && <BarChart2 className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          {renderResultItem(result)}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search footer */}
                <div className="border-t px-4 py-3 flex justify-between items-center text-xs text-gray-500">
                  <div>
                    Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">ESC</kbd> to close
                  </div>
                  <div>
                    <span className="mr-2">Navigate:</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border ml-1">↓</kbd>
                    <span className="mx-2">Select:</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Enter</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSearch;
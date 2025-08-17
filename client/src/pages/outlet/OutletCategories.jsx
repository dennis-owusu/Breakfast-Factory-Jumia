import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const OutletCategories = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [allCategories, setAllCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/allcategories', {
          headers: { Authorization: `Bearer ${currentUser?.token}` }
        });
        const data = await res.json();
        if (data) {
          setAllCategories(data.allCategory || []);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to load categories');
      }
      setLoading(false);
    };
    if (currentUser) fetchCategories();
  }, [currentUser]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/category/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentUser?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAllCategories(allCategories.filter(cat => cat._id !== id));
        toast.success('Category deleted');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  const filteredCategories = allCategories
    .filter(cat => cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.categoryName.localeCompare(b.categoryName);
      if (sortBy === 'name-desc') return b.categoryName.localeCompare(a.categoryName);
      return 0;
    });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const displayedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Categories</h1>
        <Link to="/outlet/categories/new">
          <Button className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Input 
            placeholder="Search categories" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
            <SelectItem value="name-asc" className="dark:hover:bg-gray-700">Name: A-Z</SelectItem>
            <SelectItem value="name-desc" className="dark:hover:bg-gray-700">Name: Z-A</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={() => { setSearchTerm(''); setSortBy('name-asc'); }} 
          variant="outline" 
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        >
          Clear Filters
        </Button>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-700 text-left text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">
                <TableHead className="p-3 dark:border-gray-600">Name</TableHead>
                <TableHead className="p-3 dark:border-gray-600">Description</TableHead>
                <TableHead className="p-3 dark:border-gray-600">Featured</TableHead>
                <TableHead className="p-3 text-right dark:border-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedCategories.length > 0 ? (
                displayedCategories.map(cat => (
                  <TableRow key={cat._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="p-3 dark:text-gray-300">{cat.categoryName}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{cat.description || 'N/A'}</TableCell>
                    <TableCell className="p-3 dark:text-gray-300">{cat.featured ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="p-3 text-right">
                      <Link to={`/outlet/category-form/${cat._id}`}>
                        <Button variant="ghost" className="dark:text-gray-300 dark:hover:bg-gray-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDelete(cat._id)}
                        className="dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={4} 
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-between items-center mt-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-md">
        <Button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(prev => prev - 1)}
          variant="outline"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <Button 
          disabled={currentPage >= totalPages} 
          onClick={() => setCurrentPage(prev => prev + 1)}
          variant="outline"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OutletCategories;
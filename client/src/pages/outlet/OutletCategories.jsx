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
        const res = await fetch('/api/route/allcategories', {
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
      const res = await fetch(`/api/route/category/delete/${id}`, {
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        <Link to="/outlet/categories/new">
          <Button className="bg-orange-500 text-white"><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
        </Link>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Input placeholder="Search categories" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name: A-Z</SelectItem>
            <SelectItem value="name-desc">Name: Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setSearchTerm(''); setSortBy('name-asc'); }} variant="outline">Clear Filters</Button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-left text-sm font-medium text-gray-600 uppercase">
              <TableHead className="p-3">Name</TableHead>
              <TableHead className="p-3">Description</TableHead>
              <TableHead className="p-3">Featured</TableHead>
              <TableHead className="p-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedCategories.length > 0 ? (
              displayedCategories.map(cat => (
                <TableRow key={cat._id} className="border-t hover:bg-gray-50">
                  <TableCell className="p-3">{cat.categoryName}</TableCell>
                  <TableCell className="p-3">{cat.description || 'N/A'}</TableCell>
                  <TableCell className="p-3">{cat.featured ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="p-3 text-right">
                    <Link to={`/outlet/category-form/${cat._id}`}>
                      <Button variant="ghost"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" onClick={() => handleDelete(cat._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No categories found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <div className="flex justify-between mt-4">
        <Button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OutletCategories;

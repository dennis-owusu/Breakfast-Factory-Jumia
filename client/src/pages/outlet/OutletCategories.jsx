import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

const OutletCategories = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/route/allcategories?search=${search}&page=${currentPage}&limit=${itemsPerPage}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        const data = await res.json();
        if (data.success) {
          setCategories(data.allCategory || []);
          setTotalPages(Math.ceil(data.total / itemsPerPage));
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to load categories');
      }
      setLoading(false);
    };
    fetchCategories();
  }, [search, currentPage, currentUser.token]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/route/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCategories(categories.filter(cat => cat._id !== id));
        toast.success('Category deleted');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        <Link to="/outlet/categories/new">
          <Button><Plus /> Add Category</Button>
        </Link>
      </div>
      <div className="mb-4">
        <Input placeholder="Search categories" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map(cat => (
            <TableRow key={cat._id}>
              <TableCell>{cat.categoryName}</TableCell>
              <TableCell>{cat.description || 'N/A'}</TableCell>
              <TableCell>
                <Link to={`/outlet/categories/${cat._id}`}><Button variant="ghost"><Edit /></Button></Link>
                <Button variant="ghost" onClick={() => handleDelete(cat._id)}><Trash2 /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between mt-4">
        <Button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><ChevronLeft /></Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}><ChevronRight /></Button>
      </div>
    </div>
  );
};

export default OutletCategories;
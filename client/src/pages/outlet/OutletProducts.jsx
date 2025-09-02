import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import autoTable from 'jspdf-autotable'
import {
  AlertCircle,
  ShoppingBag,
  Plus,
  Search,
  ArrowUpDown,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const ITEMS_PER_PAGE = 10;

const OutletProducts = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('https://breakfast-factory-jumia.onrender.com/api/route/allcategories');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch categories');
        setCategories(Array.isArray(data.allCategory) ? data.allCategory : []);
      } catch (err) {
        toast.error('Error loading categories');
        setCategories([]);
        // FIX: Extract the error message instead of passing the error object
        toast.error(err.message || 'Unknown error occurred');
      }
    };
    fetchCategories();
  }, []);

const handleDeleteProduct = async (productId) => {
  if (!productId) return;

  try {
    setLoading(true);
    const res = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/delete/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Include credentials for authentication
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete product');
    }

    // Update local state by removing the deleted product
    setProducts(prevProducts => 
      prevProducts.filter(product => product._id !== productId)
    );

    toast.success('Product deleted successfully');
    setIsDeleteModalOpen(false);
    setProductToDelete(null);

    // Recalculate total pages
    const newTotalProducts = totalProducts - 1;
    setTotalProducts(newTotalProducts);
    setTotalPages(Math.ceil(newTotalProducts / ITEMS_PER_PAGE));

    // If current page is empty, go to previous page
    if (products.length === 1 && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }

  } catch (err) {
    // FIX: Extract the error message instead of passing the error object
    console.error('Delete product error:', err);
    toast.error(err.message || 'Error deleting product');
  } finally {
    setLoading(false);
  }
};

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          startIndex: (currentPage - 1) * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
          ...(searchTerm && { searchTerm }),
          order: sortBy.includes('asc') ? 'asc' : 'desc',
          sort: sortBy.includes('price') ? 'productPrice' :
                sortBy.includes('name') ? 'productName' :
                sortBy.includes('category') ? 'category' :
                sortBy.includes('stock') ? 'numberOfProductsAvailable' : 'updatedAt',
          ...(categoryFilter !== 'all' && { category: categoryFilter })
        });
        const res = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/allproducts?${queryParams.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch products');
        setProducts(Array.isArray(data.products) ? data.products : []);
        setTotalProducts(data.totalProducts || 0);
        setTotalPages(Math.ceil((data.totalProducts || 0) / ITEMS_PER_PAGE));
      } catch (err) {
        toast.error('Error loading products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchTerm, sortBy, categoryFilter, currentPage]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
  setSearchTerm('');
  setCategoryFilter('all');
  setSortBy('newest');
  setCurrentPage(1);
};

// Put these inside OutletProducts (above handleDownload)

// Build query with the same filters/sorting you're using in the UI
const buildQueryParams = (overrides = {}) => {
  const params = new URLSearchParams({
    startIndex: String(overrides.startIndex ?? 0),
    limit: String(overrides.limit ?? ITEMS_PER_PAGE),
  });

  if (searchTerm) params.set('searchTerm', searchTerm);

  params.set('order', sortBy.includes('asc') ? 'asc' : 'desc');

  let sortField = 'updatedAt';
  if (sortBy.includes('price')) sortField = 'productPrice';
  else if (sortBy.includes('name')) sortField = 'productName';
  else if (sortBy.includes('category')) sortField = 'category';
  else if (sortBy.includes('stock')) sortField = 'numberOfProductsAvailable';
  params.set('sort', sortField);

  if (categoryFilter !== 'all') params.set('category', categoryFilter);

  return params;
};

// Fetch all products across pages for export (respects current filters/sort)
const fetchAllProductsForExport = async () => {
  const CHUNK_SIZE = 200;
  let startIndex = 0;
  const all = [];

  while (true) {
    const queryParams = buildQueryParams({ startIndex, limit: CHUNK_SIZE });
    const res = await fetch(
      `https://breakfast-factory-jumia.onrender.com/api/route/allproducts?${queryParams.toString()}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch products for export');

    const batch = Array.isArray(data.products) ? data.products : [];
    all.push(...batch);

    if (batch.length < CHUNK_SIZE) break;
    startIndex += CHUNK_SIZE;
  }

  return all;
};

const handleDownload = async () => {
  const loadingToast = toast.loading('Generating PDF...');
  const pdf = new jsPDF('p', 'mm', 'a4');

  // 1) Fetch ALL products across pagination with current filters/sort
  let allProducts = [];
  try {
    allProducts = await fetchAllProductsForExport();
  } catch (err) {
    console.error('Export fetch error:', err);
    toast.dismiss(loadingToast);
    toast.error(err.message || 'Error fetching all products for export');
    return;
  }

  // 2) Build larger, high-contrast HTML (Category + Description removed)
  const element = document.createElement('div');
  element.style.cssText = `
    width: 820px;              /* smaller width => larger output in PDF */
    padding: 44px;
    background: #ffffff;
    color: #0f172a;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  `;

  const placeholderImage =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTAiIGZpbGw9IiNFRkUxRTYiLz4KPHBhdGggZD0iTTQwIDU3QzQ0LjQxODMgNTcgNDggNTMuNDE4MyA0OCA0OUM0OCA0NC41ODE3IDQ0LjQxODMgNDEgNDAgNDFDMzUuNTgxNyA0MSAzMiA0NC41ODE3IDMyIDQ5QzMyIDUzLjQxODMgMzUuNTgxNyA1NyA0MCA1N1oiIHN0cm9rZT0iI0MwQzhEMSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0yNiA2MUwzNyA0NEw0MCA0OC41TDQ3IDQwTDU2IDUwTDYwIDQ2VjYxSDI2WiIgc3Ryb2tlPSIjQzBDOEQxIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 2,
      }).format(Number(value) || 0);
    } catch {
      const num = Number(value);
      return `₵${Number.isFinite(num) ? num.toFixed(2) : '0.00'}`;
    }
  };

  let html = `
    <div style="margin-bottom: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 0.2px;">
        Products Report
      </h1>
      <div style="margin-top: 8px; font-size: 14px; color: #475569;">
        Generated on ${new Date().toLocaleDateString()}
      </div>
      <div style="margin-top: 16px; height: 4px; background: linear-gradient(90deg, #0ea5e9 0%, #10b981 100%); border-radius: 3px;"></div>
    </div>

    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #e5e7eb;">
      <colgroup>
        <col style="width: 120px" />
        <col />
        <col style="width: 160px" />
        <col style="width: 120px" />
      </colgroup>
      <thead>
        <tr style="background: #0f172a;">
          <th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 0.3px; border-right: 1px solid #1f2937;">Image</th>
          <th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 0.3px; border-right: 1px solid #1f2937;">Name</th>
          <th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 0.3px; border-right: 1px solid #1f2937;">Price</th>
          <th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 0.3px;">Stock</th>
        </tr>
      </thead>
      <tbody>
  `;

  allProducts.forEach((p, i) => {
    const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    const stock = Number(p.numberOfProductsAvailable) || 0;
    const stockBg = stock > 10 ? '#ecfdf5' : stock > 0 ? '#fffbeb' : '#fef2f2';
    const stockColor = stock > 10 ? '#065f46' : stock > 0 ? '#92400e' : '#991b1b';
    const img = p.productImage || placeholderImage;

    html += `
      <tr style="background: ${rowBg}; border-top: 1px solid #e5e7eb;">
        <td style="padding: 14px 12px; border-right: 1px solid #e5e7eb;">
          <div style="width: 88px; height: 88px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center;">
            <img src="${img}" crossorigin="anonymous" referrerpolicy="no-referrer"
                 width="88" height="88"
                 style="width: 88px; height: 88px; object-fit: cover; display: block;" />
          </div>
        </td>
        <td style="padding: 16px 14px; border-right: 1px solid #e5e7eb; color: #0f172a; font-weight: 700; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${p.productName || 'N/A'}
        </td>
        <td style="padding: 16px 14px; border-right: 1px solid #e5e7eb; color: #065f46; font-weight: 800; font-size: 16px; text-align: right;">
          ${formatCurrency(p.productPrice)}
        </td>
        <td style="padding: 16px 14px; text-align: right;">
          <span style="
            display: inline-block;
            min-width: 44px;
            text-align: center;
            background: ${stockBg};
            color: ${stockColor};
            font-weight: 800;
            font-size: 15px;
            padding: 6px 10px;
            border-radius: 9999px;
            border: 1px solid #e5e7eb;
          ">
            ${stock}
          </span>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>

    <div style="margin-top: 18px; text-align: center; color: #475569; font-size: 14px; font-weight: 600;">
      Total Products: ${allProducts.length}
    </div>
  `;

  element.innerHTML = html;
  document.body.appendChild(element);

  // 3) Render and split across multiple PDF pages (higher scale + smaller margins)
  try {
    await new Promise((r) => setTimeout(r, 700)); // allow images to load

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 6; // mm (smaller margin => more room => bigger appearance)
    const contentWidth = pageWidth - margin * 2;

    const scale = Math.max(3, Math.min(4, (window.devicePixelRatio || 1) * 2.5)); // high scale for sharpness
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 15000,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    const usableHeight = pageHeight - margin * 2;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
    heightLeft -= usableHeight;

    // Additional pages
    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    pdf.save(`products-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Error generating PDF');
  } finally {
    document.body.removeChild(element);
    toast.dismiss(loadingToast);
  }
};

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Products</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Products
          </Button>
          <Button
            onClick={() => navigate('/outlet/product/new')}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-md mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>

          <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((
                category) => (
                <SelectItem key={category._id} value={category.categoryName}>
                  {category.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A-Z</SelectItem>
              <SelectItem value="name-desc">Name: Z-A</SelectItem>
              <SelectItem value="category-asc">Category: A-Z</SelectItem>
              <SelectItem value="category-desc">Category: Z-A</SelectItem>
              <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
              <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleClearFilters} variant="outline" className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            Clear Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader size="lg" />
        </div>
      ) : products.length > 0 ? (
        <div>
          {/* Responsive Table for Medium and Large Screens */}
          <div className="hidden sm:block bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-md overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-left text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">
                      <div className="flex items-center gap-2 w-full">
                        <img
                          src={product.productImage || 'https://via.placeholder.com/40'}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {product.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{product.category?.categoryName || product.category || 'Uncategorized'}</td>
                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100">₵{product.productPrice.toFixed(2)}</td>
                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{product.numberOfProductsAvailable}</td>
                    <td className="p-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/outlet/product/${product._id}`)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/outlet/product/${product._id}/edit`)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/outlet/restock?productId=${product._id}&quantity=${product.numberOfProductsAvailable}`)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <RefreshCw className="h-4 w-4 text-green-500 dark:text-green-400" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDeleteModalOpen(true);
                          setProductToDelete(product);
                        }}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400"/>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Table View */}
          <div className="sm:hidden bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-md overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  <th className="p-2">Product</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={product.productImage || 'https://via.placeholder.com/40'}
                          alt=""
                          className="h-8 w-8 rounded object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{product.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                            {product.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-xs text-gray-900 dark:text-gray-100">{product.category?.categoryName || product.category || 'Uncategorized'}</td>
                    <td className="p-2 text-xs text-gray-900 dark:text-gray-100">₵{product.productPrice.toFixed(2)}</td>
                    <td className="p-2 text-xs text-gray-900 dark:text-gray-100">{product.numberOfProductsAvailable}</td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/outlet/product/${product._id}`)}
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/outlet/product/${product._id}/edit`)}
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/outlet/restock?productId=${product._id}&quantity=${product.numberOfProductsAvailable}`)}
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <RefreshCw className="h-3 w-3 text-green-500 dark:text-green-400" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsDeleteModalOpen(true);
                            setProductToDelete(product);
                          }}
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="h-3 w-3 text-red-500 dark:text-red-400"/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <ShoppingBag className="mx-auto h-12 w-12 mb-2" />
          <p>No products found. Add your first product to get started.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6">
          {/* Desktop Pagination */}
          <div className="hidden md:flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-md">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)} of {totalProducts} products
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "bg-orange-500 text-white hover:bg-orange-600" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Next
              </Button>
            </div>
          </div>

          {/* Mobile Pagination */}
          <div className="md:hidden bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-md">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex justify-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg dark:shadow-md w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">Are you sure you want to delete "{productToDelete.productName}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteProduct(productToDelete._id)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutletProducts;
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './components/layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Lazy loaded pages for better performance
const UserDashboard = React.lazy(() => import('./pages/user/UserDashboard'));
const UserOrders = React.lazy(() => import('./pages/user/UserOrders'));
const UserProfile = React.lazy(() => import('./pages/user/UserProfile'));

const OutletDashboard = React.lazy(() => import('./pages/outlet/OutletDashboard'));
const OutletProducts = React.lazy(() => import('./pages/outlet/OutletProducts'));
const OutletOrders = React.lazy(() => import('./pages/outlet/OutletOrders'));
const OutletProfile = React.lazy(() => import('./pages/outlet/OutletProfile'));
const ProductForm = React.lazy(() => import('./pages/outlet/ProductForm'));
const OrderDetail = React.lazy(() => import('./pages/outlet/OrderDetail'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = React.lazy(() => import('./pages/admin/UsersManagement'));
const OutletsManagement = React.lazy(() => import('./pages/admin/OutletsManagement'));
const ProductsManagement = React.lazy(() => import('./pages/admin/ProductsManagement'));
const OrdersManagement = React.lazy(() => import('./pages/admin/OrdersManagement'));
const AdminOrderDetail = React.lazy(() => import('./pages/admin/OrderDetail'));
const Analytics = React.lazy(() => import('./pages/admin/Analytics'));
const CategoriesManagement = React.lazy(() => import('./pages/admin/CategoriesManagement'));
const CategoryForm = React.lazy(() => import('./pages/admin/CategoryForm'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
  </div>
);

// Wrapper component for outlet routes with DashboardLayout
const OutletRouteWithLayout = ({ element }) => (
  <DashboardLayout>
    {element}
  </DashboardLayout>
);

function App() {
  
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* User Routes */}
            <Route 
              path="/user/dashboard" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <UserDashboard />
                </React.Suspense>
              } 
            />
            <Route 
              path="/user/orders" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <UserOrders />
                </React.Suspense>
              } 
            />
            <Route 
              path="/user/profile" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <UserProfile />
                </React.Suspense>
              } 
            />
            
            {/* Outlet Routes */}
           
            <Route 
              path="/outlet/dashboard" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletDashboard />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/products" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <ErrorBoundary>
                      <React.Suspense fallback={<LoadingFallback />}>
                        <OutletProducts />
                      </React.Suspense>
                    </ErrorBoundary>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/products/new" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <ProductForm />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/products/:id" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <ProductForm />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/orders" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletOrders />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/orders/:id" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OrderDetail />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/profile" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletProfile />
                    </React.Suspense>
                  }
                />
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <UsersManagement />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/outlets" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <OutletsManagement />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <ProductsManagement />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <OrdersManagement />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/orders/:id" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <AdminOrderDetail />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Analytics />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/categories" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <CategoriesManagement />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/categories/:id" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <CategoryForm />
                </React.Suspense>
              } 
            />
            <Route 
              path="/admin/categories/new" 
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <CategoryForm />
                </React.Suspense>
              } 
            />
            
            {/* Redirect to appropriate dashboard based on role */}
            <Route 
              path="/dashboard" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <OutletDashboard />
                  }
                />
              } 
            />
            
            {/* Catch all route - 404 */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
                <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Page Not Found</h2>
                <p className="text-gray-600 mb-8">The page you are looking for doesn't exist or has been moved.</p>
                <button 
                  onClick={() => window.history.back()}
                  className="px-4 py-2 mr-4 text-sm font-medium text-orange-500 bg-orange-100 rounded-md hover:bg-orange-200"
                >
                  Go Back
                </button>
                <a 
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600"
                >
                  Go Home
                </a>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

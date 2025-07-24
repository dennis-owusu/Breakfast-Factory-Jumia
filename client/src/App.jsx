import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './components/layouts/DashboardLayout';


// Pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/user/OrderConfirmationPage';
import OrdersPage from './pages/user/OrdersPage';
import MomoTestPage from './pages/MomoTestPage';

// Lazy loaded pages for better performance
const UserDashboard = React.lazy(() => import('./pages/user/UserDashboard'));
const UserOrders = React.lazy(() => import('./pages/user/UserOrders'));
const UserProfile = React.lazy(() => import('./pages/user/UserProfile'));

const OutletDashboard = React.lazy(() => import('./pages/outlet/OutletDashboard'));
const OutletProducts = React.lazy(() => import('./pages/outlet/OutletProducts'));
const OutletOrders = React.lazy(() => import('./pages/outlet/OutletOrders'));
const OutletCategoryForm = React.lazy(() => import('./pages/outlet/OutletCategoryForm'));
const OutletProfile = React.lazy(() => import('./pages/outlet/OutletProfile'));
const OutletAnalytics = React.lazy(() => import('./pages/outlet/OutletAnalytics'));
const OutletSales = React.lazy(() => import('./pages/outlet/OutletSales'));
const OutletSellPage = React.lazy(() => import('./pages/outlet/OutletSellPage'));
const ProductForm = React.lazy(() => import('./pages/outlet/ProductForm'));
const ProductView = React.lazy(() => import('./pages/outlet/ProductView'));
const ProductEdit = React.lazy(() => import('./pages/outlet/ProductEdit'));
const OutletCategories = React.lazy(() => import('./pages/outlet/OutletCategories'));
const OutletOrderDetail = React.lazy(() => import('./pages/outlet/OutletOrderDetail'));
const OutletTransactions = React.lazy(() => import('./pages/outlet/OutletTransactions'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = React.lazy(() => import('./pages/admin/UsersManagement'));
const UserView = React.lazy(() => import('./pages/admin/UserView'));
const UserEdit = React.lazy(() => import('./pages/admin/UserEdit'));
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

// Wrapper components for routes with DashboardLayout
const OutletRouteWithLayout = ({ element }) => (
  <DashboardLayout userRole="outlet">
    {element}
  </DashboardLayout>
);

const AdminRouteWithLayout = ({ element }) => (
  <DashboardLayout userRole="admin">
    {element}
  </DashboardLayout>
);

function App() {
  
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Toaster position="top-right" toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            style: {
              background: '#22c55e',
              color: '#fff',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#22c55e',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }} />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/user/orders" element={<OrdersPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/user/orders/:id" element={<OrderConfirmationPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/momo-test" element={<MomoTestPage />} />
            
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
                   
                        <OutletProducts />
                     
                  }
                />
              } 
            />
           
            <Route 
              path="/outlet/product/new" 
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
              path="/outlet/categories" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletCategories />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/categories/new" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletCategoryForm />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/product/:id" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <ProductView />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/product/:id/edit" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <ProductEdit />
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
                      <OutletOrderDetail />
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
            <Route 
              path="/outlet/analytics" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletAnalytics />
                    </React.Suspense>
                  }
                />
              } 
            />
<Route 
              path="/outlet/sales" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletSales />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/outlet/sell" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletSellPage />
                    </React.Suspense>
                  }
                />
              } 
            />
<Route 
              path="/outlet/transactions" 
              element={
                <OutletRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletTransactions />
                    </React.Suspense>
                  }
                />
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <AdminDashboard />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <UsersManagement />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/users/:id" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <UserView />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/users/:id/edit" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <UserEdit />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/outlets" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OutletsManagement />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <ProductsManagement />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <OrdersManagement />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/orders/:id" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <AdminOrderDetail />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <Analytics />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/categories" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <CategoriesManagement />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/categories/:id" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <CategoryForm />
                    </React.Suspense>
                  }
                />
              } 
            />
            <Route 
              path="/admin/categories/new" 
              element={
                <AdminRouteWithLayout 
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <CategoryForm />
                    </React.Suspense>
                  }
                />
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

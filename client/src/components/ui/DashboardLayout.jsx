import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Store, 
  Settings, 
  LogOut, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

const DashboardLayout = ({ children, userRole }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { 
        label: 'Dashboard', 
        icon: <LayoutDashboard className="h-5 w-5" />, 
        path: `/${userRole}/dashboard` 
      },
      { 
        label: 'Settings', 
        icon: <Settings className="h-5 w-5" />, 
        path: `/${userRole}/settings` 
      },
    ];

    if (userRole === 'admin') {
      return [
        ...commonItems,
        { 
          label: 'Users', 
          icon: <Users className="h-5 w-5" />, 
          path: '/admin/users' 
        },
        { 
          label: 'Outlets', 
          icon: <Store className="h-5 w-5" />, 
          path: '/admin/outlets' 
        },
        { 
          label: 'Products', 
          icon: <Package className="h-5 w-5" />, 
          path: '/admin/products' 
        },
        { 
          label: 'Orders', 
          icon: <ShoppingBag className="h-5 w-5" />, 
          path: '/admin/orders' 
        },
      ];
    } else if (userRole === 'outlet') {
      return [
        ...commonItems,
        { 
          label: 'Products', 
          icon: <Package className="h-5 w-5" />, 
          path: '/outlet/products' 
        },
        { 
          label: 'Orders', 
          icon: <ShoppingBag className="h-5 w-5" />, 
          path: '/outlet/orders' 
        },
      ];
    } else {
      return [
        ...commonItems,
        { 
          label: 'Orders', 
          icon: <ShoppingBag className="h-5 w-5" />, 
          path: '/user/orders' 
        },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleSidebar}>
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b">
            <h1 className="text-xl font-bold text-orange-600">Breakfast Factory</h1>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${location.pathname === item.path ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="lg:hidden w-8"></div>
          <h1 className="text-lg font-semibold lg:hidden">Breakfast Factory</h1>
          
          {/* User dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                  <span className="hidden md:inline">John Doe</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Link to="/profile" className="w-full">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/settings" className="w-full">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Link to="/logout" className="w-full">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
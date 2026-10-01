import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, Warehouse,
  Truck, Wrench, CreditCard, BarChart3, UserCog, Settings as SettingsIcon,
  Database, LogOut, Menu, X, Search, Bell, Moon, Sun, ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, permission: 'dashboard.view' },
  { id: 'sales', label: 'فروش', icon: ShoppingCart, permission: 'sales.view' },
  { id: 'customers', label: 'مشتریان', icon: Users, permission: 'customers.view' },
  { id: 'products', label: 'محصولات', icon: Package, permission: 'products.view' },
  { id: 'inventory', label: 'انبار', icon: Warehouse, permission: 'inventory.view' },
  { id: 'purchases', label: 'خرید', icon: Truck, permission: 'purchases.view' },
  { id: 'repairs', label: 'تعمیرات', icon: Wrench, permission: 'repairs.view' },
  { id: 'payments', label: 'پرداخت‌ها', icon: CreditCard, permission: 'reports.view' },
  { id: 'reports', label: 'گزارش‌ها', icon: BarChart3, permission: 'reports.view' },
  { id: 'users', label: 'کاربران', icon: UserCog, permission: 'users.view' },
  { id: 'settings', label: 'تنظیمات', icon: SettingsIcon, permission: 'settings.view' },
  { id: 'backup', label: 'پشتیبان‌گیری', icon: Database, permission: 'backup.create' },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, hasPermission, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredMenu = menuItems.filter(item => hasPermission(item.permission));

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-800 shadow-xl z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                ID
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white">ID Mobile</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manager Pro</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            {filteredMenu.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-1 transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role === 'admin' ? 'مدیر سیستم' : user?.role}
                </p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="خروج"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:mr-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {menuItems.find(m => m.id === currentPage)?.label || 'داشبورد'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="جستجو..."
                  className="bg-transparent outline-none text-sm w-48"
                />
              </div>

              {/* Notifications */}
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg relative">
                <Bell size={20} />
                <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Theme Toggle */}
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <Moon size={20} className="dark:hidden" />
                <Sun size={20} className="hidden dark:block" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}

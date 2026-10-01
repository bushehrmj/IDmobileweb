import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, Warehouse,
  Truck, Wrench, CreditCard, BarChart3, UserCog, Settings as SettingsIcon,
  Database, LogOut, Menu, X, Search, Bell, Moon, Sun, ChevronDown,
  DollarSign, BookOpen, ArrowRightLeft, FileText, Wallet, PieChart
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
  {
    id: 'financial', label: 'مالی', icon: DollarSign, permission: 'financial.view',
    children: [
      { id: 'financial', label: 'داشبورد مالی', icon: BarChart3, permission: 'financial.dashboard' },
      { id: 'cashbank', label: 'صندوق و بانک', icon: Wallet, permission: 'financial.cash' },
      { id: 'expenses', label: 'هزینه و درآمد', icon: CreditCard, permission: 'financial.expenses' },
      { id: 'financialreports', label: 'گزارش جامع مالی', icon: PieChart, permission: 'financial.reports' },
      { id: 'chartofaccounts', label: 'سرفصل حساب‌ها', icon: BookOpen, permission: 'financial.chart_of_accounts' },
      { id: 'generalledger', label: 'دفتر کل', icon: BookOpen, permission: 'financial.journal' },
      { id: 'checks', label: 'چک‌ها', icon: FileText, permission: 'financial.reports' },
      { id: 'transfers', label: 'انتقال بین حساب‌ها', icon: ArrowRightLeft, permission: 'financial.reports' },
      { id: 'customeraccounts', label: 'حساب مشتریان', icon: Users, permission: 'financial.receivables' },
      { id: 'supplieraccounts', label: 'حساب تأمین‌کنندگان', icon: Truck, permission: 'financial.payables' },
    ]
  },
  { id: 'payments', label: 'پرداخت‌ها', icon: CreditCard, permission: 'reports.view' },
  { id: 'reports', label: 'گزارش‌ها', icon: BarChart3, permission: 'reports.view' },
  { id: 'users', label: 'کاربران', icon: UserCog, permission: 'users.view' },
  { id: 'settings', label: 'تنظیمات', icon: SettingsIcon, permission: 'settings.view' },
  { id: 'backup', label: 'پشتیبان‌گیری', icon: Database, permission: 'backup.create' },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, hasPermission, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['financial']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const filteredMenu = menuItems.filter(item => hasPermission(item.permission));

  const renderMenuItem = (item: any, isChild = false) => {
    const isActive = currentPage === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);

    const visibleChildren = hasChildren
      ? item.children.filter((child: any) => hasPermission(child.permission))
      : [];

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              onNavigate(item.id);
              setSidebarOpen(false);
            }
          }}
          className={`w-full flex items-center ${isChild ? 'pr-12' : 'pr-4'} py-3 rounded-xl text-sm mb-1 transition-all duration-300 group ${
            isActive
              ? 'bg-gradient-to-l from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700'
          }`}
        >
          <item.icon size={20} className={`${isChild ? 'ml-3' : 'ml-4'} transition-transform duration-300 group-hover:scale-110`} />
          <span className="flex-1 text-right font-medium">{item.label}</span>
          {hasChildren && (
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {hasChildren && isExpanded && visibleChildren.length > 0 && (
          <div className="mr-4 border-r-2 border-blue-200 dark:border-blue-800 pr-2 mb-2 animate-fadeIn">
            {visibleChildren.map((child: any) => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 animate-float">
                ID
              </div>
              <div>
                <h1 className="font-bold text-lg gradient-text">ID Mobile</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manager Pro</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredMenu.map(item => renderMenuItem(item))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role === 'admin' ? 'مدیر سیستم' : user?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 hover:scale-110"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:mr-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-2xl font-bold gradient-text">
                {menuItems.find(m => m.id === currentPage)?.label || 'داشبورد'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="جستجو..."
                  className="bg-transparent outline-none text-sm w-48"
                />
              </div>

              {/* Notifications */}
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 relative">
                <Bell size={20} />
                <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Theme Toggle */}
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300">
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

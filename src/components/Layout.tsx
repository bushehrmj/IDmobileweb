import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, Warehouse,
  Truck, Wrench, CreditCard, BarChart3, UserCog, Settings as SettingsIcon,
  Database, LogOut, Menu, X, Search, Bell, Moon, Sun, ChevronDown, ChevronLeft,
  DollarSign, BookOpen, ArrowRightLeft, FileText, Wallet, PieChart, Plus
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import QuickActions from './QuickActions';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  permission: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
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
  const { user, hasPermission, canViewPage, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['financial']);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setQuickActionsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const filteredMenu = menuItems.filter(item => hasPermission(item.permission));

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const isActive = currentPage === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);

    const visibleChildren = hasChildren
      ? item.children!.filter(child => hasPermission(child.permission) && canViewPage(child.id))
      : [];

    if (minimized && !isChild) {
      return (
        <button
          key={item.id}
          onClick={() => {
            if (hasChildren) {
              setMinimized(false);
              toggleMenu(item.id);
            } else {
              onNavigate(item.id);
            }
          }}
          className={`w-full flex items-center justify-center p-3 rounded-lg mb-1 transition-colors relative group ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title={item.label}
        >
          <item.icon size={20} />
          <span className="absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {item.label}
          </span>
        </button>
      );
    }

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
          className={`w-full flex items-center ${isChild ? 'pr-10' : 'pr-3'} py-2.5 rounded-lg text-sm mb-1 transition-colors ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <item.icon size={18} className={isChild ? 'ml-2' : 'ml-3'} />
          {!isChild && <span className="flex-1 text-right">{item.label}</span>}
          {isChild && <span className="flex-1 text-right text-xs">{item.label}</span>}
          {hasChildren && (
            <ChevronDown
              size={14}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {hasChildren && isExpanded && visibleChildren.length > 0 && (
          <div className="mr-2 border-r-2 border-blue-200 dark:border-blue-800 pr-1 mb-1">
            {visibleChildren.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  const sidebarWidth = minimized ? 'w-16' : 'w-72';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full ${sidebarWidth} bg-white dark:bg-slate-800 shadow-xl z-50 transform transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${minimized ? 'px-2' : ''}`}>
            <div className={`flex items-center ${minimized ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                ID
              </div>
              {!minimized && (
                <div className="flex-1">
                  <h1 className="font-bold text-base text-slate-900 dark:text-white">ID Mobile</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manager Pro</p>
                </div>
              )}
              {!minimized && (
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Minimize Button */}
          <button
            onClick={() => setMinimized(!minimized)}
            className="hidden lg:flex items-center justify-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700"
            title={minimized ? 'باز کردن منو' : 'بستن منو'}
          >
            <ChevronLeft size={18} className={`transition-transform ${minimized ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu */}
          <nav className={`flex-1 overflow-y-auto p-2 ${minimized ? 'px-1' : ''}`}>
            {filteredMenu.map(item => renderMenuItem(item))}
          </nav>

          {/* User Info */}
          <div className={`p-3 border-t border-slate-200 dark:border-slate-700 ${minimized ? 'px-1' : ''}`}>
            {minimized ? (
              <button onClick={logout} className="w-full flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="خروج">
                <LogOut size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-500">{user?.role === 'admin' ? 'مدیر' : user?.role === 'manager' ? 'مدیر فروشگاه' : user?.role === 'seller' ? 'فروشنده' : user?.role === 'technician' ? 'تعمیرکار' : 'انباردار'}</p>
                </div>
                <button onClick={logout} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="خروج">
                  <LogOut size={16} />
                </button>
              </div>
            )}
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
      <div className={`flex-1 ${minimized ? 'lg:mr-16' : 'lg:mr-72'} transition-all duration-300`}>
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {menuItems.find(m => m.id === currentPage)?.label || 
                 menuItems.find(m => m.children?.some(c => c.id === currentPage))?.children?.find(c => c.id === currentPage)?.label || 
                 'داشبورد'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <Search size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">جستجو...</span>
                <kbd className="text-xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded">Ctrl+K</kbd>
              </button>

              <button 
                onClick={() => setQuickActionsOpen(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                title="دسترسی سریع (Ctrl+N)"
              >
                <Plus size={20} />
              </button>

              <NotificationCenter />

              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <Moon size={20} className="dark:hidden" />
                <Sun size={20} className="hidden dark:block" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>

      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={onNavigate}
      />

      <QuickActions
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}

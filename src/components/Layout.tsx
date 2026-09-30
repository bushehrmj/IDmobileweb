import React, { useState, useEffect } from 'react';
import { useAuth, toJalaliFull } from '../lib/auth';
import { db, type Settings } from '../lib/db';
import {
  LayoutDashboard, ShoppingCart, Users, Package, Warehouse,
  Truck, Wrench, CreditCard, BarChart3, UserCog, Settings as SettingsIcon,
  Database, LogOut, Menu, X, Search, Bell, Moon, Sun, ChevronDown, ChevronLeft,
  BookOpen, ArrowRightLeft, FileText, DollarSign, Wallet, TrendingUp, PieChart
} from 'lucide-react';

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
  const [settings, setSettings] = useState<Settings>(db.getSettings());
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['financial']);

  useEffect(() => {
    setSettings(db.getSettings());
    const notifs: string[] = [];
    const products = db.getProducts();
    const lowStock = products.filter(p => p.stock <= p.minStock && p.minStock > 0);
    if (lowStock.length > 0) notifs.push(`${lowStock.length} کالا موجودی کم دارد`);
    const repairs = db.getRepairs().filter(r => r.status === 'ready_for_delivery');
    if (repairs.length > 0) notifs.push(`${repairs.length} تعمیر آماده تحویل`);
    const customers = db.getCustomers().filter(c => c.debt > 0);
    if (customers.length > 0) notifs.push(`${customers.length} مشتری بدهکار`);
    setNotifications(notifs);
  }, [currentPage]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const filteredMenu = menuItems.filter(item =>
    hasPermission(item.permission) && canViewPage(item.id)
  );

  const handleLogout = () => logout();

  const toggleDarkMode = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    const newSettings: Settings = { ...settings, theme: newTheme as 'light' | 'dark' };
    db.saveSettings(newSettings);
    setSettings(newSettings);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Global search
  const searchResults = searchQuery.length > 1 ? (() => {
    const results: { type: string; label: string; id: string; page: string }[] = [];
    const q = searchQuery.toLowerCase();
    if (hasPermission('products.view')) {
      db.getProducts().filter(p => p.name.includes(q) || p.barcode?.includes(q) || p.brand?.includes(q)).slice(0, 5)
        .forEach(p => results.push({ type: 'کالا', label: `${p.name} - ${p.brand}`, id: p.id, page: 'products' }));
    }
    if (hasPermission('customers.view')) {
      db.getCustomers().filter(c => c.firstName.includes(q) || c.lastName.includes(q) || c.mobile?.includes(q)).slice(0, 5)
        .forEach(c => results.push({ type: 'مشتری', label: `${c.firstName} ${c.lastName}`, id: c.id, page: 'customers' }));
    }
    if (hasPermission('repairs.view')) {
      db.getRepairs().filter(r => r.ticketNumber.includes(q) || r.customerName.includes(q) || r.imei?.includes(q)).slice(0, 5)
        .forEach(r => results.push({ type: 'تعمیر', label: `#${r.ticketNumber} - ${r.customerName}`, id: r.id, page: 'repairs' }));
    }
    return results;
  })() : [];

  const sidebarWidth = minimized ? 'w-16' : 'w-64';

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const isActive = currentPage === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);

    // Filter children based on permissions
    const visibleChildren = hasChildren
      ? item.children!.filter(child => hasPermission(child.permission) && canViewPage(child.id))
      : [];

    if (minimized && !isChild) {
      // Minimized mode - only icons
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
          {/* Tooltip */}
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

        {/* Children */}
        {hasChildren && isExpanded && visibleChildren.length > 0 && (
          <div className="mr-2 border-r-2 border-blue-200 dark:border-blue-800 pr-1 mb-1">
            {visibleChildren.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full ${sidebarWidth} bg-white dark:bg-slate-800 shadow-xl z-50 transform transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${minimized ? 'px-2' : ''}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${minimized ? 'justify-center w-full' : 'gap-2'}`}>
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-8 h-8 rounded" />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">ID</div>
                )}
                {!minimized && (
                  <div>
                    <h1 className="font-bold text-sm text-blue-800 dark:text-blue-400">{settings.storeName}</h1>
                    <p className="text-[10px] text-slate-500">Manager Pro</p>
                  </div>
                )}
              </div>
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

          {/* User info */}
          <div className={`p-3 border-t border-slate-200 dark:border-slate-700 ${minimized ? 'px-1' : ''}`}>
            {minimized ? (
              <button onClick={handleLogout} className="w-full flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="خروج">
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
                <button onClick={handleLogout} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="خروج">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`lg:${sidebarWidth} min-h-screen flex flex-col transition-all duration-300`} style={{ marginRight: minimized ? '4rem' : undefined }}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-bold hidden sm:block">
                {menuItems.find(m => m.id === currentPage)?.label ||
                  menuItems.find(m => m.children?.some(c => c.id === currentPage))?.children?.find(c => c.id === currentPage)?.label ||
                  'داشبورد'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-9 pl-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 w-48 focus:w-64 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 right-0 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto z-50">
                    {searchResults.map((r, i) => (
                      <button key={i} onClick={() => { onNavigate(r.page); setSearchQuery(''); }}
                        className="w-full px-3 py-2 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{r.type}</span>
                        <span className="truncate">{r.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg relative">
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 left-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{notifications.length}</span>
                  )}
                </button>
              </div>

              {/* Theme toggle */}
              <button onClick={toggleDarkMode} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Profile */}
              <div className="relative">
                <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown size={14} />
                </button>
                {showProfile && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="font-medium text-sm">{user?.fullName}</p>
                      <p className="text-xs text-slate-500">@{user?.username}</p>
                    </div>
                    <button onClick={() => { onNavigate('settings'); setShowProfile(false); }}
                      className="w-full px-3 py-2 text-right text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <SettingsIcon size={14} /> تنظیمات
                    </button>
                    <button onClick={handleLogout}
                      className="w-full px-3 py-2 text-right text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-2">
                      <LogOut size={14} /> خروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 lg:hidden z-30">
        <div className="flex items-center justify-around py-1">
          {filteredMenu.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-[10px] ${
                currentPage === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
          <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center gap-0.5 px-2 py-2 text-slate-500 text-[10px]">
            <Menu size={18} />
            <span>منو</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

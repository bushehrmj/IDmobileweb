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
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, permission: 'dashboard.view', color: 'teal' },
  { id: 'sales', label: 'فروش', icon: ShoppingCart, permission: 'sales.view', color: 'green' },
  { id: 'customers', label: 'مشتریان', icon: Users, permission: 'customers.view', color: 'purple' },
  { id: 'products', label: 'محصولات', icon: Package, permission: 'products.view', color: 'orange' },
  { id: 'inventory', label: 'انبار', icon: Warehouse, permission: 'inventory.view', color: 'blue' },
  { id: 'purchases', label: 'خرید', icon: Truck, permission: 'purchases.view', color: 'pink' },
  { id: 'repairs', label: 'تعمیرات', icon: Wrench, permission: 'repairs.view', color: 'red' },
  {
    id: 'financial', label: 'مالی', icon: DollarSign, permission: 'financial.view', color: 'emerald',
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
  { id: 'payments', label: 'پرداخت‌ها', icon: CreditCard, permission: 'reports.view', color: 'cyan' },
  { id: 'reports', label: 'گزارش‌ها', icon: BarChart3, permission: 'reports.view', color: 'indigo' },
  { id: 'users', label: 'کاربران', icon: UserCog, permission: 'users.view', color: 'violet' },
  { id: 'settings', label: 'تنظیمات', icon: SettingsIcon, permission: 'settings.view', color: 'slate' },
  { id: 'backup', label: 'پشتیبان‌گیری', icon: Database, permission: 'backup.create', color: 'amber' },
];

const colorMap: Record<string, string> = {
  teal: 'from-teal-500 to-cyan-600',
  green: 'from-green-500 to-emerald-600',
  purple: 'from-purple-500 to-violet-600',
  orange: 'from-orange-500 to-amber-600',
  blue: 'from-blue-500 to-indigo-600',
  pink: 'from-pink-500 to-rose-600',
  red: 'from-red-500 to-orange-600',
  emerald: 'from-emerald-500 to-teal-600',
  cyan: 'from-cyan-500 to-blue-600',
  indigo: 'from-indigo-500 to-purple-600',
  violet: 'from-violet-500 to-purple-600',
  slate: 'from-slate-500 to-gray-600',
  amber: 'from-amber-500 to-orange-600',
};

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
    const colorClass = colorMap[item.color] || colorMap.teal;

    const visibleChildren = hasChildren
      ? item.children.filter((child: any) => hasPermission(child.permission))
      : [];

    return (
      <div key={item.id} className="animate-fadeInUp">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              onNavigate(item.id);
              setSidebarOpen(false);
            }
          }}
          className={`w-full flex items-center ${isChild ? 'pr-12' : 'pr-4'} py-3.5 rounded-2xl text-sm mb-2 transition-all duration-400 group relative overflow-hidden ${
            isActive
              ? `bg-gradient-to-l ${colorClass} text-white shadow-xl`
              : 'text-slate-700 dark:text-slate-200 hover:bg-gradient-to-l hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isActive 
              ? 'bg-white/20' 
              : `bg-gradient-to-br ${colorClass} bg-opacity-10`
          } transition-all duration-300 group-hover:scale-110`}>
            <item.icon size={20} className={isActive ? 'text-white' : `text-${item.color}-600`} />
          </div>
          <span className="flex-1 text-right font-bold mr-3">{item.label}</span>
          {hasChildren && (
            <ChevronDown
              size={18}
              className={`transition-transform duration-400 ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {hasChildren && isExpanded && visibleChildren.length > 0 && (
          <div className="mr-6 border-r-4 border-teal-300 dark:border-teal-700 pr-3 mb-3 animate-slideInRight">
            {visibleChildren.map((child: any) => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-slate-900 dark:via-teal-900 dark:to-emerald-900">
      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-500 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0 border-l-4 border-teal-500`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b-2 border-teal-100 dark:border-teal-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-float">
                ID
              </div>
              <div>
                <h1 className="font-black text-2xl text-gradient">ID Mobile</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manager Pro</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredMenu.map(item => renderMenuItem(item))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t-2 border-teal-100 dark:border-teal-900">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user?.role === 'admin' ? 'مدیر سیستم' : user?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-12"
                title="خروج"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fadeInUp"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:mr-80">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b-2 border-teal-100 dark:border-teal-900 shadow-lg">
          <div className="flex items-center justify-between px-8 py-5">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <Menu size={28} />
              </button>
              <h2 className="text-3xl font-black text-gradient">
                {menuItems.find(m => m.id === currentPage)?.label || 'داشبورد'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:flex items-center gap-3 bg-gradient-to-l from-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl px-5 py-3 shadow-md">
                <Search size={20} className="text-teal-500" />
                <input 
                  type="text" 
                  placeholder="جستجو..."
                  className="bg-transparent outline-none text-sm w-56 font-medium"
                />
              </div>

              {/* Notifications */}
              <button className="p-3 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 relative hover:scale-110">
                <Bell size={24} className="text-teal-600 dark:text-teal-400" />
                <span className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Theme Toggle */}
              <button className="p-3 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 hover:scale-110 hover:rotate-12">
                <Moon size={24} className="text-teal-600 dark:hidden" />
                <Sun size={24} className="hidden dark:block text-amber-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 animate-fadeInUp">
          {children}
        </main>
      </div>
    </div>
  );
}

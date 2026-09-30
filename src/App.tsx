import React, { useState, useEffect } from 'react';
import { AuthProvider, ToastProvider, useAuth } from './lib/auth';
import { initializeDB } from './lib/db';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Repairs from './pages/Repairs';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import UsersPage from './pages/Users';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import BackupPage from './pages/Backup';
import Payments from './pages/Payments';
import { Shield, FileWarning } from 'lucide-react';

// Initialize DB
initializeDB();

function AppContent() {
  const { isAuthenticated, hasPermission, canViewPage } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Apply theme
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Page permission check
  const pagePermissionMap: Record<string, string> = {
    dashboard: 'dashboard.view',
    sales: 'sales.view',
    invoices: 'sales.view',
    proformas: 'sales.view',
    customers: 'customers.view',
    products: 'products.view',
    inventory: 'inventory.view',
    purchases: 'purchases.view',
    suppliers: 'purchases.view',
    repairs: 'repairs.view',
    payments: 'reports.view',
    reports: 'reports.view',
    users: 'users.view',
    settings: 'settings.view',
    backup: 'backup.create',
  };

  const requiredPermission = pagePermissionMap[currentPage];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <Shield size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400">دسترسی غیرمجاز</h2>
          <p className="text-sm text-slate-500 mt-2">شما دسترسی به این صفحه را ندارید</p>
          <button onClick={() => setCurrentPage('dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            بازگشت به داشبورد
          </button>
        </div>
      </Layout>
    );
  }

  if (!canViewPage(currentPage)) {
    return (
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <FileWarning size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-600 dark:text-slate-400">صفحه در دسترس نیست</h2>
          <p className="text-sm text-slate-500 mt-2">این صفحه برای شما نمایش داده نمی‌شود</p>
          <button onClick={() => setCurrentPage('dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            بازگشت به داشبورد
          </button>
        </div>
      </Layout>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'sales': case 'invoices': case 'proformas': return <Sales />;
      case 'products': return <Products />;
      case 'customers': return <Customers />;
      case 'repairs': return <Repairs />;
      case 'reports': return <Reports />;
      case 'settings': return <SettingsPage />;
      case 'users': return <UsersPage />;
      case 'purchases': case 'suppliers': return <Purchases />;
      case 'inventory': return <Inventory />;
      case 'backup': return <BackupPage />;
      case 'payments': return <Payments />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, ToastProvider, useAuth } from './lib/auth';
import { initializeDB } from './lib/db';
import { initializeFinancialDB } from './lib/financialDb';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Onboarding from './components/Onboarding';
import { Shield, FileWarning } from 'lucide-react';

// Lazy load pages for code splitting
const Sales = lazy(() => import('./pages/Sales'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Repairs = lazy(() => import('./pages/Repairs'));
const Reports = lazy(() => import('./pages/Reports'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const UsersPage = lazy(() => import('./pages/Users'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Inventory = lazy(() => import('./pages/Inventory'));
const BackupPage = lazy(() => import('./pages/Backup'));
const Payments = lazy(() => import('./pages/Payments'));
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'));
const CashAndBank = lazy(() => import('./pages/CashAndBank'));
const ExpensesAndIncome = lazy(() => import('./pages/ExpensesAndIncome'));
const FinancialReports = lazy(() => import('./pages/FinancialReports'));
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'));
const GeneralLedger = lazy(() => import('./pages/GeneralLedger'));
const Checks = lazy(() => import('./pages/Checks'));
const Transfers = lazy(() => import('./pages/Transfers'));
const CustomerAccounts = lazy(() => import('./pages/CustomerAccounts'));
const SupplierAccounts = lazy(() => import('./pages/SupplierAccounts'));
const ComprehensiveFinancialReport = lazy(() => import('./pages/ComprehensiveFinancialReport'));
const SalesCharts = lazy(() => import('./pages/SalesCharts'));
const Profile = lazy(() => import('./pages/Profile'));
const PrintSettings = lazy(() => import('./pages/PrintSettings'));
const PrintHistory = lazy(() => import('./pages/PrintHistory'));
const ApiStatus = lazy(() => import('./pages/ApiStatus'));
const Migration = lazy(() => import('./pages/Migration'));

// Initialize DB
initializeDB();
initializeFinancialDB();

// Loading component
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, hasPermission, canViewPage, refreshUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Apply theme
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Check if user has seen onboarding
  useEffect(() => {
    if (isAuthenticated) {
      const hasSeenOnboarding = localStorage.getItem('idmobile_onboarding_completed');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('idmobile_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  // Refresh user data on mount to get latest permissions
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated]);

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
    // Financial pages
    financial: 'financial.dashboard',
    cashbank: 'financial.cash',
    expenses: 'financial.expenses',
    financialreports: 'financial.reports',
    chartofaccounts: 'financial.chart_of_accounts',
    generalledger: 'financial.journal',
    checks: 'financial.reports',
    transfers: 'financial.reports',
    customeraccounts: 'financial.receivables',
    supplieraccounts: 'financial.payables',
    comprehensivereport: 'financial.reports',
    salescharts: 'reports.view',
    profile: 'dashboard.view',
    printsettings: 'settings.view',
    printhistory: 'settings.view',
    apistatus: 'settings.view',
    migration: 'backup.create',
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
      case 'sales': case 'invoices': case 'proformas': 
        return <Suspense fallback={<PageLoading />}><Sales /></Suspense>;
      case 'products': 
        return <Suspense fallback={<PageLoading />}><Products /></Suspense>;
      case 'customers': 
        return <Suspense fallback={<PageLoading />}><Customers /></Suspense>;
      case 'repairs': 
        return <Suspense fallback={<PageLoading />}><Repairs /></Suspense>;
      case 'reports': 
        return <Suspense fallback={<PageLoading />}><Reports /></Suspense>;
      case 'settings': 
        return <Suspense fallback={<PageLoading />}><SettingsPage /></Suspense>;
      case 'users': 
        return <Suspense fallback={<PageLoading />}><UsersPage /></Suspense>;
      case 'purchases': case 'suppliers': 
        return <Suspense fallback={<PageLoading />}><Purchases /></Suspense>;
      case 'inventory': 
        return <Suspense fallback={<PageLoading />}><Inventory /></Suspense>;
      case 'backup': 
        return <Suspense fallback={<PageLoading />}><BackupPage /></Suspense>;
      case 'payments': 
        return <Suspense fallback={<PageLoading />}><Payments /></Suspense>;
      case 'financial': 
        return <Suspense fallback={<PageLoading />}><FinancialDashboard /></Suspense>;
      case 'cashbank': 
        return <Suspense fallback={<PageLoading />}><CashAndBank /></Suspense>;
      case 'expenses': 
        return <Suspense fallback={<PageLoading />}><ExpensesAndIncome /></Suspense>;
      case 'financialreports': 
        return <Suspense fallback={<PageLoading />}><FinancialReports /></Suspense>;
      case 'chartofaccounts': 
        return <Suspense fallback={<PageLoading />}><ChartOfAccounts /></Suspense>;
      case 'generalledger': 
        return <Suspense fallback={<PageLoading />}><GeneralLedger /></Suspense>;
      case 'checks': 
        return <Suspense fallback={<PageLoading />}><Checks /></Suspense>;
      case 'transfers': 
        return <Suspense fallback={<PageLoading />}><Transfers /></Suspense>;
      case 'customeraccounts': 
        return <Suspense fallback={<PageLoading />}><CustomerAccounts /></Suspense>;
      case 'supplieraccounts': 
        return <Suspense fallback={<PageLoading />}><SupplierAccounts /></Suspense>;
      case 'comprehensivereport': 
        return <Suspense fallback={<PageLoading />}><ComprehensiveFinancialReport /></Suspense>;
      case 'salescharts': 
        return <Suspense fallback={<PageLoading />}><SalesCharts /></Suspense>;
      case 'profile': 
        return <Suspense fallback={<PageLoading />}><Profile /></Suspense>;
      case 'printsettings': 
        return <Suspense fallback={<PageLoading />}><PrintSettings /></Suspense>;
      case 'printhistory': 
        return <Suspense fallback={<PageLoading />}><PrintHistory /></Suspense>;
      case 'apistatus': 
        return <Suspense fallback={<PageLoading />}><ApiStatus /></Suspense>;
      case 'migration': 
        return <Suspense fallback={<PageLoading />}><Migration /></Suspense>;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </>
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

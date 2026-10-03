import React, { useState, useEffect } from 'react';
import { healthApi, authApi, getToken } from '../lib/api';
import Button from '../components/ui/Button';
import { CheckCircle, XCircle, Loader, RefreshCw, Server, Shield, Database } from 'lucide-react';

interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
}

export default function ApiStatus() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'none'>('none');

  useEffect(() => {
    checkHealth();
    checkToken();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const response = await healthApi.check();
      if (response.data) {
        setHealthStatus(response.data);
      }
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkToken = () => {
    const token = getToken();
    if (token) {
      setTokenStatus('valid');
    } else {
      setTokenStatus('none');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-700/50';
    }
  };

  const getTokenStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'invalid':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-700/50';
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">وضعیت API</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بررسی وضعیت سرور و اتصال به Backend
          </p>
        </div>
        <Button variant="primary" onClick={checkHealth} disabled={isChecking}>
          <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
          بررسی مجدد
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Server Status */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              healthStatus?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <Server size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">سرور</p>
              <p className={`text-lg font-bold ${
                healthStatus?.status === 'ok' ? 'text-green-600' : 'text-red-600'
              }`}>
                {healthStatus?.status === 'ok' ? 'فعال' : 'غیرفعال'}
              </p>
            </div>
          </div>
          {healthStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">وضعیت:</span>
                <span className={`px-2 py-1 rounded ${getStatusColor(healthStatus.status)}`}>
                  {healthStatus.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Database:</span>
                <span className="font-medium">{healthStatus.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">آخرین بررسی:</span>
                <span className="font-medium">
                  {lastCheck ? lastCheck.toLocaleTimeString('fa-IR') : '-'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Authentication Status */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              tokenStatus === 'valid' ? 'bg-green-500' : 'bg-slate-500'
            }`}>
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">احراز هویت</p>
              <p className={`text-lg font-bold ${
                tokenStatus === 'valid' ? 'text-green-600' : 'text-slate-600'
              }`}>
                {tokenStatus === 'valid' ? 'فعال' : 'غیرفعال'}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Token:</span>
              <span className={`px-2 py-1 rounded ${getTokenStatusColor(tokenStatus)}`}>
                {tokenStatus === 'valid' ? 'موجود' : 'ناموجود'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">نوع:</span>
              <span className="font-medium">JWT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">انقضا:</span>
              <span className="font-medium">24 ساعت</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              healthStatus?.database ? 'bg-green-500' : 'bg-slate-500'
            }`}>
              <Database size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">پایگاه داده</p>
              <p className={`text-lg font-bold ${
                healthStatus?.database ? 'text-green-600' : 'text-slate-600'
              }`}>
                {healthStatus?.database === 'sql.js' ? 'فعال' : 'غیرفعال'}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">نوع:</span>
              <span className="font-medium">SQLite (sql.js)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Mode:</span>
              <span className="font-medium">WAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">جداول:</span>
              <span className="font-medium">14</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          API Endpoints موجود
        </h3>
        <div className="space-y-3">
          {[
            { method: 'GET', endpoint: '/api/health', description: 'بررسی وضعیت سرور' },
            { method: 'POST', endpoint: '/api/auth/login', description: 'ورود به سیستم' },
            { method: 'POST', endpoint: '/api/auth/logout', description: 'خروج از سیستم' },
            { method: 'GET', endpoint: '/api/auth/me', description: 'اطلاعات کاربر فعلی' },
            { method: 'GET', endpoint: '/api/products', description: 'دریافت لیست محصولات' },
            { method: 'POST', endpoint: '/api/products', description: 'ایجاد محصول جدید' },
            { method: 'PUT', endpoint: '/api/products/:id', description: 'به‌روزرسانی محصول' },
            { method: 'DELETE', endpoint: '/api/products/:id', description: 'حذف محصول' },
            { method: 'GET', endpoint: '/api/customers', description: 'دریافت لیست مشتریان' },
            { method: 'POST', endpoint: '/api/customers', description: 'ایجاد مشتری جدید' },
            { method: 'GET', endpoint: '/api/sales', description: 'دریافت لیست فروش‌ها' },
            { method: 'POST', endpoint: '/api/sales', description: 'ایجاد فروش جدید' },
            { method: 'GET', endpoint: '/api/repairs', description: 'دریافت لیست تعمیرات' },
            { method: 'POST', endpoint: '/api/repairs', description: 'ایجاد تعمیر جدید' },
            { method: 'GET', endpoint: '/api/purchases', description: 'دریافت لیست خریدها' },
            { method: 'POST', endpoint: '/api/purchases', description: 'ایجاد خرید جدید' },
            { method: 'GET', endpoint: '/api/payments', description: 'دریافت لیست پرداخت‌ها' },
            { method: 'POST', endpoint: '/api/payments', description: 'ثبت پرداخت جدید' },
            { method: 'GET', endpoint: '/api/stock-movements', description: 'دریافت حرکات انبار' },
            { method: 'GET', endpoint: '/api/audit-logs', description: 'دریافت لاگ‌های حسابرسی' },
          ].map((api, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                api.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                api.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                api.method === 'PUT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {api.method}
              </span>
              <code className="text-sm font-mono text-slate-700 dark:text-slate-300 flex-1">
                {api.endpoint}
              </code>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {api.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          راهنمای تست API
        </h3>
        <div className="space-y-3 text-sm">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="font-bold text-blue-900 dark:text-blue-300 mb-2">
              ۱. تست در Browser Console
            </p>
            <code className="block bg-white dark:bg-slate-800 p-3 rounded text-xs">
              {`import('./lib/api-test').then(m => m.runAllTests())`}
            </code>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="font-bold text-green-900 dark:text-green-300 mb-2">
              ۲. تست با cURL
            </p>
            <code className="block bg-white dark:bg-slate-800 p-3 rounded text-xs">
              curl http://localhost:3000/api/health
            </code>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="font-bold text-purple-900 dark:text-purple-300 mb-2">
              ۳. تست Login
            </p>
            <code className="block bg-white dark:bg-slate-800 p-3 rounded text-xs">
              {`curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../lib/db';
import { financialDb } from '../lib/financialDb';
import { 
  Bell, X, Package, AlertTriangle, Wrench, DollarSign, 
  CheckCircle, Clock, TrendingDown
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  icon: any;
  timestamp: string;
  action?: () => void;
  read: boolean;
}

export default function NotificationCenter() {
  const { hasPermission } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const newNotifications: Notification[] = [];

    // Check low stock products
    if (hasPermission('inventory.view')) {
      const products = db.getProducts();
      const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.minStock > 0);
      
      if (lowStockProducts.length > 0) {
        newNotifications.push({
          id: 'low-stock',
          type: 'warning',
          title: 'موجودی کم',
          message: `${lowStockProducts.length} محصول موجودی کم دارند`,
          icon: Package,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      const outOfStockProducts = products.filter(p => p.stock === 0);
      if (outOfStockProducts.length > 0) {
        newNotifications.push({
          id: 'out-of-stock',
          type: 'error',
          title: 'ناموجود',
          message: `${outOfStockProducts.length} محصول ناموجود هستند`,
          icon: AlertTriangle,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    }

    // Check pending repairs
    if (hasPermission('repairs.view')) {
      const repairs = db.getRepairs();
      const readyRepairs = repairs.filter(r => r.status === 'ready_for_delivery');
      
      if (readyRepairs.length > 0) {
        newNotifications.push({
          id: 'ready-repairs',
          type: 'success',
          title: 'آماده تحویل',
          message: `${readyRepairs.length} تعمیر آماده تحویل به مشتری است`,
          icon: Wrench,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    }

    // Check customer debts
    if (hasPermission('financial.receivables')) {
      const customers = db.getCustomers();
      const debtors = customers.filter(c => c.debt > 0);
      
      if (debtors.length > 0) {
        const totalDebt = debtors.reduce((sum, c) => sum + c.debt, 0);
        newNotifications.push({
          id: 'customer-debts',
          type: 'info',
          title: 'مطالبات مشتریان',
          message: `${debtors.length} مشتری بدهکار هستند (${totalDebt.toLocaleString()} تومان)`,
          icon: DollarSign,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    }

    // Check checks due soon
    if (hasPermission('financial.reports')) {
      const checks = financialDb.getChecks();
      const today = new Date();
      const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const dueSoonChecks = checks.filter(c => {
        const dueDate = new Date(c.dueDate);
        return c.status === 'pending' && dueDate >= today && dueDate <= weekLater;
      });

      if (dueSoonChecks.length > 0) {
        newNotifications.push({
          id: 'checks-due-soon',
          type: 'warning',
          title: 'چک‌های نزدیک به سررسید',
          message: `${dueSoonChecks.length} چک در هفته آینده سررسید دارند`,
          icon: Clock,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      const overdueChecks = checks.filter(c => {
        const dueDate = new Date(c.dueDate);
        return c.status === 'pending' && dueDate < today;
      });

      if (overdueChecks.length > 0) {
        newNotifications.push({
          id: 'overdue-checks',
          type: 'error',
          title: 'چک‌های سررسید گذشته',
          message: `${overdueChecks.length} چک سررسید گذشته دارند`,
          icon: TrendingDown,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    }

    setNotifications(newNotifications);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-16 left-4 w-96 max-h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-slate-600 dark:text-slate-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">اعلان‌ها</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    خوانده شده
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                  <p className="text-slate-500 dark:text-slate-400">اعلانی وجود ندارد</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'bg-opacity-50' : ''
                      } transition-colors hover:bg-opacity-75`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getIconColor(notification.type)} bg-white dark:bg-slate-800`}>
                          <notification.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  به‌روزرسانی خودکار هر 30 ثانیه
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

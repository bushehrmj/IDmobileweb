import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../lib/db';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, Wrench, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Plus, Search, Filter
} from 'lucide-react';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Calculate stats from real data
    const sales = db.getSales().filter(s => s.status === 'completed');
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayProfit = todaySales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        return itemSum + ((item.sellPrice - item.buyPrice) * item.quantity);
      }, 0);
    }, 0);

    const customers = db.getCustomers();
    const activeCustomers = customers.filter(c => c.invoiceCount > 0).length;

    const repairs = db.getRepairs();
    const openRepairs = repairs.filter(r => !['delivered', 'cancelled'].includes(r.status)).length;

    const products = db.getProducts();
    const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.minStock > 0);

    const customerDebts = customers.reduce((sum, c) => sum + c.debt, 0);

    setStats({
      todayRevenue,
      todayProfit,
      activeCustomers,
      openRepairs,
      lowStockCount: lowStockProducts.length,
      customerDebts,
    });

    // Generate alerts
    const newAlerts: any[] = [];
    
    if (openRepairs > 0) {
      newAlerts.push({
        type: 'warning',
        icon: Wrench,
        message: `${openRepairs} تعمیر در انتظار`,
        page: 'repairs',
      });
    }

    if (lowStockProducts.length > 0) {
      newAlerts.push({
        type: 'error',
        icon: AlertTriangle,
        message: `${lowStockProducts.length} کالا زیر حداقل موجودی`,
        page: 'inventory',
      });
    }

    if (customerDebts > 0) {
      newAlerts.push({
        type: 'info',
        icon: DollarSign,
        message: `مطالبات: ${customerDebts.toLocaleString()} تومان`,
        page: 'customeraccounts',
      });
    }

    setAlerts(newAlerts);

    // Recent activities
    const activities: any[] = [];

    // Recent sales
    sales.slice(-3).reverse().forEach(sale => {
      activities.push({
        type: 'sale',
        title: 'فروش جدید',
        description: sale.customerName,
        amount: sale.total,
        time: new Date(sale.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        icon: ShoppingCart,
        color: 'bg-blue-500',
      });
    });

    // Recent repairs
    repairs.slice(-2).reverse().forEach(repair => {
      activities.push({
        type: 'repair',
        title: 'تعمیر',
        description: `${repair.customerName} - ${repair.device}`,
        time: new Date(repair.entryDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        icon: Wrench,
        color: 'bg-purple-500',
      });
    });

    setRecentActivities(activities.slice(0, 5));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fa-IR') + ' تومان';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="card p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              خوش آمدید، {user?.fullName} 👋
            </h1>
            <p className="text-white/90">
              خلاصه وضعیت امروز فروشگاه
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-4xl font-bold">
              {new Date().toLocaleDateString('fa-IR', { weekday: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <ShoppingCart size={24} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">فروش امروز</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.todayRevenue || 0)}
            </h3>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">سود امروز</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.todayProfit || 0)}
            </h3>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">مشتریان فعال</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.activeCustomers || 0} نفر
            </h3>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Wrench size={24} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">تعمیرات باز</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.openRepairs || 0} دستگاه
            </h3>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            نیازمند توجه
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  alert.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <alert.icon size={20} className={
                  alert.type === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : alert.type === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                } />
                <span className="flex-1 text-sm font-medium">
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            فعالیت‌های اخیر
          </h2>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              هنوز فعالیتی ثبت نشده است
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center`}>
                    <activity.icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-left">
                    {activity.amount && (
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(activity.amount)}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            آمار سریع
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">موجودی کم</span>
              <span className="text-lg font-bold text-amber-600">
                {stats.lowStockCount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">مطالبات</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(stats.customerDebts || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

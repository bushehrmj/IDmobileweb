import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { db } from '../lib/db';
import { financialDb } from '../lib/financialDb';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, Wrench, AlertTriangle, Calendar, Clock,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [pendingRepairs, setPendingRepairs] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const sales = db.getSales().filter(s => s.status === 'completed');
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayProfit = todaySales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + ((item.sellPrice - item.buyPrice) * item.quantity);
      }, 0);
    }, 0);

    const customers = db.getCustomers();
    const activeCustomers = customers.filter(c => c.invoiceCount > 0).length;

    const repairs = db.getRepairs();
    const openRepairs = repairs.filter(r => !['delivered', 'cancelled', 'not_repairable'].includes(r.status)).length;

    const products = db.getProducts();
    const lowStock = products.filter(p => p.stock <= p.minStock && p.minStock > 0);

    const customerDebts = customers.reduce((sum, c) => sum + c.debt, 0);

    setStats({
      todayRevenue,
      todayProfit,
      activeCustomers,
      openRepairs,
      lowStockCount: lowStock.length,
      customerDebts,
      totalSales: sales.length,
    });

    // Chart data - last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const daySales = sales.filter(s => new Date(s.date).toDateString() === dateStr);
      const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
      const profit = daySales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
          return itemSum + ((item.sellPrice - item.buyPrice) * item.quantity);
        }, 0);
      }, 0);
      
      last7Days.push({
        date: date.toLocaleDateString('fa-IR', { weekday: 'short' }),
        revenue: revenue / 1000000, // Convert to millions
        profit: profit / 1000000,
      });
    }
    setChartData(last7Days);

    setRecentSales(sales.slice(-5).reverse());
    setLowStockProducts(lowStock.slice(0, 5));
    setPendingRepairs(repairs.filter(r => r.status === 'ready_for_delivery').slice(0, 5));
  };

  const statCards = [
    {
      title: 'فروش امروز',
      value: formatCurrency(stats.todayRevenue || 0),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'سود امروز',
      value: formatCurrency(stats.todayProfit || 0),
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'مشتریان فعال',
      value: stats.activeCustomers || 0,
      icon: Users,
      color: 'bg-purple-500',
      trend: '+5',
      trendUp: true,
    },
    {
      title: 'تعمیرات باز',
      value: stats.openRepairs || 0,
      icon: Wrench,
      color: 'bg-amber-500',
      trend: '-3',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome */}
      <div className="bg-gradient-to-l from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          خوش آمدید، {user?.fullName} 👋
        </h1>
        <p className="text-blue-100">
          خلاصه وضعیت امروز فروشگاه
        </p>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{toJalali(new Date())}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                stat.trendUp 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            عملکرد 7 روز گذشته
          </h3>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                formatter={(value: number) => value.toFixed(2) + ' میلیون تومان'}
                contentStyle={{ 
                  direction: 'rtl',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="فروش"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={3}
                name="سود"
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            داده‌ای برای نمایش وجود ندارد
          </div>
        )}
      </div>

      {/* Alerts */}
      {(stats.lowStockCount > 0 || stats.customerDebts > 0 || pendingRepairs.length > 0) && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            نیازمند توجه
          </h2>
          <div className="space-y-3">
            {stats.lowStockCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <Package size={20} className="text-amber-600 dark:text-amber-400" />
                <span className="flex-1 text-sm font-medium text-amber-900 dark:text-amber-300">
                  {stats.lowStockCount} کالا موجودی کم دارند
                </span>
              </div>
            )}
            {stats.customerDebts > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <DollarSign size={20} className="text-red-600 dark:text-red-400" />
                <span className="flex-1 text-sm font-medium text-red-900 dark:text-red-300">
                  مطالبات: {formatCurrency(stats.customerDebts)}
                </span>
              </div>
            )}
            {pendingRepairs.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Wrench size={20} className="text-green-600 dark:text-green-400" />
                <span className="flex-1 text-sm font-medium text-green-900 dark:text-green-300">
                  {pendingRepairs.length} تعمیر آماده تحویل
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            فروش‌های اخیر
          </h2>
          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
              <p>هنوز فروشی ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      فاکتور #{sale.invoiceNumber}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {sale.customerName}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sale.total)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {toJalali(sale.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            موجودی کم
          </h2>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Package size={48} className="mx-auto mb-2 opacity-30" />
              <p>همه کالاها موجودی کافی دارند</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {product.brand} {product.model}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      موجودی: {product.stock}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      حداقل: {product.minStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Repairs */}
      {pendingRepairs.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            تعمیرات آماده تحویل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRepairs.map((repair, index) => (
              <div 
                key={index}
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wrench size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                    #{repair.ticketNumber}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                  {repair.customerName}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {repair.brand} {repair.model}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {toJalali(repair.entryDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

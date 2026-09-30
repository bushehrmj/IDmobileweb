import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { db, type Sale, type Product, type Repair, type Customer } from '../lib/db';
import { ShoppingCart, TrendingUp, Package, Users, Wrench, AlertTriangle, DollarSign, FileText } from 'lucide-react';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [pendingRepairs, setPendingRepairs] = useState<Repair[]>([]);
  const settings = db.getSettings();

  useEffect(() => {
    const sales = db.getSales().filter(s => s.status === 'completed');
    const products = db.getProducts();
    const repairs = db.getRepairs();
    const customers = db.getCustomers();

    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekSales = sales.filter(s => new Date(s.date) >= weekAgo);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthSales = sales.filter(s => new Date(s.date) >= monthAgo);

    const totalProfit = sales.reduce((sum, s) => {
      return sum + s.items.reduce((is, item) => is + (item.sellPrice - item.buyPrice) * item.quantity, 0);
    }, 0);

    const totalDebt = customers.reduce((sum, c) => sum + c.debt, 0);

    setStats({
      todaySales: todaySales.reduce((s, sale) => s + sale.total, 0),
      weekSales: weekSales.reduce((s, sale) => s + sale.total, 0),
      monthSales: monthSales.reduce((s, sale) => s + sale.total, 0),
      totalProfit: hasPermission('sales.view_profit') ? totalProfit : 0,
      invoiceCount: sales.length,
      totalDebt: hasPermission('reports.financial') ? totalDebt : 0,
      productCount: products.length,
      customerCount: customers.length,
    });

    setRecentSales(sales.slice(-5).reverse());
    setLowStock(products.filter(p => p.stock <= p.minStock && p.minStock > 0).slice(0, 5));
    setPendingRepairs(repairs.filter(r => ['received', 'waiting_check', 'repairing', 'waiting_part'].includes(r.status)).slice(0, 5));
  }, []);

  const cards = [
    { label: 'فروش امروز', value: formatCurrency(stats.todaySales || 0, settings.currency), icon: ShoppingCart, color: 'blue', show: hasPermission('sales.view') },
    { label: 'فروش هفته', value: formatCurrency(stats.weekSales || 0, settings.currency), icon: TrendingUp, color: 'green', show: hasPermission('sales.view') },
    { label: 'فروش ماه', value: formatCurrency(stats.monthSales || 0, settings.currency), icon: DollarSign, color: 'purple', show: hasPermission('sales.view') },
    { label: 'سود کل', value: formatCurrency(stats.totalProfit || 0, settings.currency), icon: TrendingUp, color: 'emerald', show: hasPermission('sales.view_profit') },
    { label: 'تعداد فاکتور', value: String(stats.invoiceCount || 0), icon: FileText, color: 'indigo', show: hasPermission('sales.view') },
    { label: 'بدهی مشتریان', value: formatCurrency(stats.totalDebt || 0, settings.currency), icon: AlertTriangle, color: 'red', show: hasPermission('reports.financial') },
    { label: 'محصولات', value: String(stats.productCount || 0), icon: Package, color: 'amber', show: hasPermission('products.view') },
    { label: 'مشتریان', value: String(stats.customerCount || 0), icon: Users, color: 'cyan', show: hasPermission('customers.view') },
  ].filter(c => c.show);

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 card-hover">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className="text-lg font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        {hasPermission('sales.view') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <ShoppingCart size={16} className="text-blue-500" />
              فروش‌های اخیر
            </h3>
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">فروشی ثبت نشده</p>
            ) : (
              <div className="space-y-2">
                {recentSales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">#{sale.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{sale.customerName} - {toJalali(sale.date)}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(sale.total, settings.currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Low Stock */}
        {hasPermission('inventory.view') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              موجودی کم
            </h3>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">همه کالاها موجودی کافی دارند</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.brand} - {p.model}</p>
                    </div>
                    <span className="text-xs bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                      موجودی: {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Repairs */}
        {hasPermission('repairs.view') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Wrench size={16} className="text-purple-500" />
              تعمیرات در انتظار
            </h3>
            {pendingRepairs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">تعمیر در انتظاری وجود ندارد</p>
            ) : (
              <div className="space-y-2">
                {pendingRepairs.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">#{r.ticketNumber} - {r.customerName}</p>
                      <p className="text-xs text-slate-500">{r.device} {r.brand}</p>
                    </div>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                      {r.status === 'received' ? 'دریافت شد' : r.status === 'waiting_check' ? 'در انتظار بررسی' : r.status === 'repairing' ? 'در حال تعمیر' : 'منتظر قطعه'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            هشدارها
          </h3>
          <div className="space-y-2">
            {lowStock.length > 0 && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                ⚠️ {lowStock.length} کالا موجودی کم دارد
              </div>
            )}
            {pendingRepairs.length > 0 && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                🔧 {pendingRepairs.length} تعمیر در انتظار
              </div>
            )}
            {stats.totalDebt > 0 && hasPermission('reports.financial') && (
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-700 dark:text-orange-400">
                💰 مبلغ بدهی مشتریان: {formatCurrency(stats.totalDebt, settings.currency)}
              </div>
            )}
            {lowStock.length === 0 && pendingRepairs.length === 0 && (!stats.totalDebt || !hasPermission('reports.financial')) && (
              <p className="text-sm text-slate-500 text-center py-4">هشداری وجود ندارد ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

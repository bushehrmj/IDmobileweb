import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { financialDb } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { db } from '../lib/db';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard,
  Package, Users, Truck, AlertTriangle, CheckCircle, XCircle,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function FinancialDashboard() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    calculateStats();
  }, [period]);

  const calculateStats = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    const sales = db.getSales().filter(s => 
      s.status === 'completed' && new Date(s.date) >= startDate
    );

    const purchases = db.getPurchases().filter(p => new Date(p.date) >= startDate);

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    
    const totalCOGS = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + (item.buyPrice * item.quantity), 0);
    }, 0);

    const grossProfit = totalSales - totalCOGS;

    const expenses = financialDb.getExpenses().filter(e => new Date(e.date) >= startDate);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const repairs = db.getRepairs().filter(r => 
      r.status === 'delivered' && new Date(r.createdAt) >= startDate
    );
    const repairIncome = repairs.reduce((sum, r) => sum + (r.finalTotal || r.totalCost || 0), 0);

    const totalIncome = totalSales + repairIncome;
    const netProfit = totalIncome - totalCOGS - totalExpenses;

    const cashAccounts = financialDb.getCashAccounts();
    const totalCash = cashAccounts.reduce((sum, c) => sum + c.currentBalance, 0);

    const bankAccounts = financialDb.getBankAccounts();
    const totalBank = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

    const customers = db.getCustomers();
    const totalReceivables = customers.reduce((sum, c) => sum + c.debt, 0);

    const totalPayables = purchases.reduce((sum, p) => sum + p.remaining, 0);

    const products = db.getProducts();
    const inventoryValue = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);

    const posTransactions = financialDb.getPOSTransactions().filter(t => t.status === 'pending');
    const posPending = posTransactions.reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalSales,
      totalPurchases,
      totalCOGS,
      grossProfit,
      totalExpenses,
      repairIncome,
      totalIncome,
      netProfit,
      totalReceivables,
      totalPayables,
      totalCash,
      totalBank,
      inventoryValue,
      posPending,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      repairsCount: repairs.length,
    });
  };

  const cards = [
    {
      title: 'موجودی نقدی',
      value: stats.totalCash || 0,
      icon: Wallet,
      color: 'bg-green-500',
      show: hasPermission('financial.cash'),
    },
    {
      title: 'موجودی بانک',
      value: stats.totalBank || 0,
      icon: CreditCard,
      color: 'bg-blue-500',
      show: hasPermission('financial.bank'),
    },
    {
      title: 'کارتخوان تسویه‌نشده',
      value: stats.posPending || 0,
      icon: CreditCard,
      color: 'bg-purple-500',
      show: hasPermission('financial.cash'),
    },
    {
      title: 'مطالبات مشتریان',
      value: stats.totalReceivables || 0,
      icon: Users,
      color: 'bg-amber-500',
      show: hasPermission('financial.receivables'),
    },
    {
      title: 'بدهی به تأمین‌کنندگان',
      value: stats.totalPayables || 0,
      icon: Truck,
      color: 'bg-red-500',
      show: hasPermission('financial.payables'),
    },
    {
      title: 'فروش',
      value: stats.totalSales || 0,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      show: hasPermission('financial.dashboard'),
    },
    {
      title: 'خرید',
      value: stats.totalPurchases || 0,
      icon: TrendingDown,
      color: 'bg-indigo-500',
      show: hasPermission('financial.dashboard'),
    },
    {
      title: 'هزینه‌ها',
      value: stats.totalExpenses || 0,
      icon: TrendingDown,
      color: 'bg-rose-500',
      show: hasPermission('financial.expenses'),
    },
    {
      title: 'سود ناخالص',
      value: stats.grossProfit || 0,
      icon: BarChart3,
      color: 'bg-teal-500',
      show: hasPermission('financial.profit'),
    },
    {
      title: 'سود خالص',
      value: stats.netProfit || 0,
      icon: PieChart,
      color: stats.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500',
      show: hasPermission('financial.profit'),
    },
    {
      title: 'ارزش موجودی کالا',
      value: stats.inventoryValue || 0,
      icon: Package,
      color: 'bg-cyan-500',
      show: hasPermission('financial.dashboard'),
    },
  ].filter(c => c.show);

  const grossMargin = stats.totalIncome > 0 ? ((stats.grossProfit || 0) / stats.totalIncome * 100) : 0;
  const netMargin = stats.totalIncome > 0 ? ((stats.netProfit || 0) / stats.totalIncome * 100) : 0;
  const currentRatio = (stats.totalCash + stats.totalBank) / (stats.totalPayables || 1);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">داشبورد مالی</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">نمای کلی وضعیت مالی فروشگاه</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value as typeof period)}
          className="input w-auto"
        >
          <option value="today">امروز</option>
          <option value="week">این هفته</option>
          <option value="month">این ماه</option>
          <option value="year">امسال</option>
        </select>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{card.title}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(card.value, settings.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Health */}
      {hasPermission('financial.dashboard') && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            سلامت مالی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">حاشیه سود ناخالص</p>
              <p className="text-3xl font-bold text-green-600 mb-2">{grossMargin.toFixed(1)}%</p>
              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.min(grossMargin, 100)}%` }} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">حاشیه سود خالص</p>
              <p className={`text-3xl font-bold mb-2 ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netMargin.toFixed(1)}%
              </p>
              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${netMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(netMargin), 100)}%` }} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">نسبت جاری</p>
              <p className={`text-3xl font-bold mb-2 ${currentRatio >= 1.5 ? 'text-green-600' : currentRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                {currentRatio.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentRatio >= 2 ? 'عالی' : currentRatio >= 1.5 ? 'خوب' : currentRatio >= 1 ? 'متوسط' : 'ضعیف'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accounting Equation */}
      {hasPermission('financial.dashboard') && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">معادله حسابداری</h3>
          <div className="flex items-center justify-center gap-4 text-center flex-wrap">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl min-w-[150px]">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">دارایی‌ها</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(AccountingService.getTotalAssets(), settings.currency)}
              </p>
            </div>
            <span className="text-3xl font-bold text-slate-400">=</span>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl min-w-[150px]">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">بدهی‌ها</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(AccountingService.getTotalLiabilities(), settings.currency)}
              </p>
            </div>
            <span className="text-3xl font-bold text-slate-400">+</span>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl min-w-[150px]">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">حقوق مالکانه</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(AccountingService.getTotalEquity(), settings.currency)}
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            {AccountingService.verifyAccountingEquation() ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                <CheckCircle size={16} />
                معادله حسابداری متوازن است
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                <XCircle size={16} />
                مغایرت در معادله حسابداری
              </span>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {hasPermission('financial.dashboard') && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            هشدارهای مالی
          </h3>
          <div className="space-y-3">
            {stats.totalReceivables > stats.totalSales * 0.3 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ مطالبات بالا: {formatCurrency(stats.totalReceivables, settings.currency)}
                </p>
              </div>
            )}
            {stats.totalPayables > stats.totalCash + stats.totalBank && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  ⚠️ بدهی بیشتر از نقدینگی
                </p>
              </div>
            )}
            {grossMargin < 15 && stats.totalSales > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  ⚠️ حاشیه سود ناخالص پایین: {grossMargin.toFixed(1)}%
                </p>
              </div>
            )}
            {stats.totalCash < 1000000 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  ℹ️ موجودی نقدی پایین
                </p>
              </div>
            )}
            {!(stats.totalReceivables > stats.totalSales * 0.3) && 
             !(stats.totalPayables > stats.totalCash + stats.totalBank) && 
             !(grossMargin < 15 && stats.totalSales > 0) && 
             !(stats.totalCash < 1000000) && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ وضعیت مالی مناسب است
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

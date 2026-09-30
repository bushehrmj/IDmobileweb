import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { financialDb } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { db } from '../lib/db';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard,
  Package, Users, Truck, AlertTriangle, CheckCircle, XCircle,
  BarChart3, PieChart, Activity
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

    // Get all sales
    const sales = db.getSales().filter(s => 
      s.status === 'completed' && new Date(s.date) >= startDate
    );

    // Get all purchases
    const purchases = db.getPurchases().filter(p => 
      new Date(p.date) >= startDate
    );

    // Calculate totals
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    
    // Calculate COGS
    const totalCOGS = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + (item.buyPrice * item.quantity), 0);
    }, 0);

    // Calculate gross profit
    const grossProfit = totalSales - totalCOGS;

    // Get expenses
    const expenses = financialDb.getExpenses().filter(e => new Date(e.date) >= startDate);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Net profit
    const netProfit = grossProfit - totalExpenses;

    // Get receivables (customer debts)
    const customers = db.getCustomers();
    const totalReceivables = customers.reduce((sum, c) => sum + c.debt, 0);

    // Get payables (supplier debts)
    const totalPayables = purchases.reduce((sum, p) => sum + p.remaining, 0);

    // Cash position
    const cashAccounts = financialDb.getCashAccounts();
    const totalCash = cashAccounts.reduce((sum, c) => sum + c.currentBalance, 0);

    // Bank position
    const bankAccounts = financialDb.getBankAccounts();
    const totalBank = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

    // Inventory value
    const products = db.getProducts();
    const inventoryValue = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);

    // POS pending
    const posTransactions = financialDb.getPOSTransactions().filter(t => t.status === 'pending');
    const posPending = posTransactions.reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalSales,
      totalPurchases,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      totalReceivables,
      totalPayables,
      totalCash,
      totalBank,
      inventoryValue,
      posPending,
    });
  };

  const cards = [
    {
      title: 'موجودی نقدی',
      value: stats.totalCash || 0,
      icon: Wallet,
      color: 'green',
      show: hasPermission('financial.cash'),
    },
    {
      title: 'موجودی بانک',
      value: stats.totalBank || 0,
      icon: CreditCard,
      color: 'blue',
      show: hasPermission('financial.bank'),
    },
    {
      title: 'کارتخوان تسویه‌نشده',
      value: stats.posPending || 0,
      icon: CreditCard,
      color: 'purple',
      show: hasPermission('financial.cash'),
    },
    {
      title: 'مطالبات مشتریان',
      value: stats.totalReceivables || 0,
      icon: Users,
      color: 'amber',
      show: hasPermission('financial.receivables'),
    },
    {
      title: 'بدهی به تأمین‌کنندگان',
      value: stats.totalPayables || 0,
      icon: Truck,
      color: 'red',
      show: hasPermission('financial.payables'),
    },
    {
      title: 'فروش',
      value: stats.totalSales || 0,
      icon: TrendingUp,
      color: 'green',
      show: hasPermission('financial.dashboard'),
    },
    {
      title: 'خرید',
      value: stats.totalPurchases || 0,
      icon: TrendingDown,
      color: 'blue',
      show: hasPermission('financial.dashboard'),
    },
    {
      title: 'هزینه‌ها',
      value: stats.totalExpenses || 0,
      icon: TrendingDown,
      color: 'red',
      show: hasPermission('financial.expenses'),
    },
    {
      title: 'سود ناخالص',
      value: stats.grossProfit || 0,
      icon: BarChart3,
      color: 'emerald',
      show: hasPermission('financial.profit'),
    },
    {
      title: 'سود خالص',
      value: stats.netProfit || 0,
      icon: PieChart,
      color: 'indigo',
      show: hasPermission('financial.profit'),
    },
    {
      title: 'ارزش موجودی کالا',
      value: stats.inventoryValue || 0,
      icon: Package,
      color: 'cyan',
      show: hasPermission('financial.dashboard'),
    },
  ].filter(c => c.show);

  const colorMap: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  };

  // Financial health indicators
  const grossMargin = stats.totalSales > 0 ? ((stats.grossProfit || 0) / stats.totalSales * 100) : 0;
  const netMargin = stats.totalSales > 0 ? ((stats.netProfit || 0) / stats.totalSales * 100) : 0;
  const currentRatio = (stats.totalCash + stats.totalBank) / (stats.totalPayables || 1);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">داشبورد مالی</h2>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value as typeof period)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
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
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 card-hover">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                <card.icon size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{card.title}</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(card.value, settings.currency)}</p>
          </div>
        ))}
      </div>

      {/* Financial Health */}
      {hasPermission('financial.dashboard') && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            سلامت مالی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">حاشیه سود ناخالص</p>
              <p className="text-2xl font-bold text-green-600">{grossMargin.toFixed(1)}%</p>
              <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${Math.min(grossMargin, 100)}%` }} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">حاشیه سود خالص</p>
              <p className={`text-2xl font-bold ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netMargin.toFixed(1)}%
              </p>
              <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div className={`h-full ${netMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(netMargin), 100)}%` }} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">نسبت جاری</p>
              <p className={`text-2xl font-bold ${currentRatio >= 1.5 ? 'text-green-600' : currentRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                {currentRatio.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {currentRatio >= 2 ? 'عالی' : currentRatio >= 1.5 ? 'خوب' : currentRatio >= 1 ? 'متوسط' : 'ضعیف'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accounting Equation Verification */}
      {hasPermission('financial.dashboard') && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4">معادله حسابداری</h3>
          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <p className="text-sm text-slate-500">دارایی‌ها</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(AccountingService.getTotalAssets(), settings.currency)}
              </p>
            </div>
            <span className="text-2xl font-bold">=</span>
            <div>
              <p className="text-sm text-slate-500">بدهی‌ها</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(AccountingService.getTotalLiabilities(), settings.currency)}
              </p>
            </div>
            <span className="text-2xl font-bold">+</span>
            <div>
              <p className="text-sm text-slate-500">حقوق مالکانه</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(AccountingService.getTotalEquity(), settings.currency)}
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            {AccountingService.verifyAccountingEquation() ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                <CheckCircle size={16} /> معادله حسابداری متوازن است
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
                <XCircle size={16} /> مغایرت در معادله حسابداری
              </span>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {hasPermission('financial.dashboard') && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            هشدارهای مالی
          </h3>
          <div className="space-y-2">
            {stats.totalReceivables > stats.totalSales * 0.3 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                ⚠️ مطالبات بالا: {formatCurrency(stats.totalReceivables, settings.currency)}
              </div>
            )}
            {stats.totalPayables > stats.totalCash + stats.totalBank && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                ⚠️ بدهی بیشتر از نقدینگی
              </div>
            )}
            {grossMargin < 15 && stats.totalSales > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-700 dark:text-orange-400">
                ⚠️ حاشیه سود ناخالص پایین: {grossMargin.toFixed(1)}%
              </div>
            )}
            {stats.totalCash < 1000000 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                ℹ️ موجودی نقدی پایین
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

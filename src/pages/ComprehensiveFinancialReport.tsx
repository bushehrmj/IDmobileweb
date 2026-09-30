import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { financialDb } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { db } from '../lib/db';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard,
  Package, Users, Truck, BarChart3, PieChart, Download, Printer
} from 'lucide-react';

export default function ComprehensiveFinancialReport() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [reportData, setReportData] = useState<any>({});

  useEffect(() => {
    calculateReport();
  }, [period]);

  const calculateReport = () => {
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

    // Sales
    const sales = db.getSales().filter(s => 
      s.status === 'completed' && new Date(s.date) >= startDate
    );
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCOGS = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + (item.buyPrice * item.quantity), 0);
    }, 0);
    const grossProfit = totalSales - totalCOGS;

    // Purchases
    const purchases = db.getPurchases().filter(p => new Date(p.date) >= startDate);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);

    // Expenses
    const expenses = financialDb.getExpenses().filter(e => new Date(e.date) >= startDate);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Income (other than sales)
    const incomes = financialDb.getIncomeTransactions().filter(i => new Date(i.date) >= startDate);
    const totalOtherIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    // Repairs
    const repairs = db.getRepairs().filter(r => 
      r.status === 'delivered' && new Date(r.createdAt) >= startDate
    );
    const repairIncome = repairs.reduce((sum, r) => sum + r.totalCost, 0);
    const repairPartsCost = repairs.reduce((sum, r) => sum + r.partsCost, 0);
    const repairLabor = repairs.reduce((sum, r) => sum + r.labor, 0);

    // Net Profit
    const totalIncome = totalSales + totalOtherIncome + repairIncome;
    const totalCost = totalCOGS + totalExpenses + repairPartsCost;
    const netProfit = totalIncome - totalCost;

    // Cash Position
    const cashAccounts = financialDb.getCashAccounts();
    const totalCash = cashAccounts.reduce((sum, c) => sum + c.currentBalance, 0);

    // Bank Position
    const bankAccounts = financialDb.getBankAccounts();
    const totalBank = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

    // Receivables
    const customers = db.getCustomers();
    const totalReceivables = customers.reduce((sum, c) => sum + c.debt, 0);

    // Payables
    const totalPayables = purchases.reduce((sum, p) => sum + p.remaining, 0);

    // Inventory Value
    const products = db.getProducts();
    const inventoryValue = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);

    // Expense Breakdown
    const expenseBreakdown: Record<string, number> = {};
    expenses.forEach(e => {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    // Sales by Payment Method
    const salesByPayment = {
      cash: sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
      card: sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0),
      credit: sales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0),
      mixed: sales.filter(s => s.paymentMethod === 'mixed').reduce((sum, s) => sum + s.total, 0),
    };

    setReportData({
      totalSales,
      totalCOGS,
      grossProfit,
      totalPurchases,
      totalExpenses,
      totalOtherIncome,
      repairIncome,
      repairPartsCost,
      repairLabor,
      totalIncome,
      totalCost,
      netProfit,
      totalCash,
      totalBank,
      totalReceivables,
      totalPayables,
      inventoryValue,
      expenseBreakdown,
      salesByPayment,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      repairsCount: repairs.length,
    });
  };

  const exportCSV = () => {
    const headers = ['شاخص', 'مقدار'];
    const rows = [
      ['جمع فروش', reportData.totalSales],
      ['بهای تمام‌شده', reportData.totalCOGS],
      ['سود ناخالص', reportData.grossProfit],
      ['جمع خرید', reportData.totalPurchases],
      ['جمع هزینه‌ها', reportData.totalExpenses],
      ['سایر درآمدها', reportData.totalOtherIncome],
      ['درآمد تعمیرات', reportData.repairIncome],
      ['سود خالص', reportData.netProfit],
      ['موجودی نقدی', reportData.totalCash],
      ['موجودی بانک', reportData.totalBank],
      ['مطالبات', reportData.totalReceivables],
      ['بدهی‌ها', reportData.totalPayables],
      ['ارزش موجودی', reportData.inventoryValue],
    ];

    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive_financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const grossMargin = reportData.totalIncome > 0 ? (reportData.grossProfit / reportData.totalIncome * 100) : 0;
  const netMargin = reportData.totalIncome > 0 ? (reportData.netProfit / reportData.totalIncome * 100) : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PieChart size={28} className="text-blue-500" />
          گزارش جامع مالی
        </h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as typeof period)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          >
            <option value="today">امروز</option>
            <option value="week">این هفته</option>
            <option value="month">این ماه</option>
            <option value="year">امسال</option>
            <option value="all">کل دوره</option>
          </select>
          <button onClick={exportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Download size={14} /> اکسل
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Printer size={14} /> چاپ
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm">جمع فروش</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(reportData.totalSales || 0, settings.currency)}</p>
          <p className="text-xs mt-1 opacity-80">{reportData.salesCount || 0} فاکتور</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} />
            <span className="text-sm">جمع خرید</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(reportData.totalPurchases || 0, settings.currency)}</p>
          <p className="text-xs mt-1 opacity-80">{reportData.purchasesCount || 0} فاکتور</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={20} />
            <span className="text-sm">جمع هزینه‌ها</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(reportData.totalExpenses || 0, settings.currency)}</p>
        </div>

        <div className={`bg-gradient-to-br ${reportData.netProfit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'} rounded-xl p-4 text-white`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} />
            <span className="text-sm">سود خالص</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(reportData.netProfit || 0, settings.currency)}</p>
          <p className="text-xs mt-1 opacity-80">حاشیه: {netMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Income & Expenses Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" />
            درآمدها
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm">فروش کالا</span>
              <span className="font-bold text-green-600">{formatCurrency(reportData.totalSales || 0, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm">درآمد تعمیرات</span>
              <span className="font-bold text-green-600">{formatCurrency(reportData.repairIncome || 0, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm">سایر درآمدها</span>
              <span className="font-bold text-green-600">{formatCurrency(reportData.totalOtherIncome || 0, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg font-bold border-2 border-green-200 dark:border-green-800">
              <span>جمع درآمدها</span>
              <span className="text-green-700 dark:text-green-400">{formatCurrency(reportData.totalIncome || 0, settings.currency)}</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingDown size={20} className="text-red-500" />
            هزینه‌ها
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm">بهای تمام‌شده کالا</span>
              <span className="font-bold text-red-600">{formatCurrency(reportData.totalCOGS || 0, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm">هزینه‌های عملیاتی</span>
              <span className="font-bold text-red-600">{formatCurrency(reportData.totalExpenses || 0, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm">هزینه قطعات تعمیرات</span>
              <span className="font-bold text-red-600">{formatCurrency(reportData.repairPartsCost || 0, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg font-bold border-2 border-red-200 dark:border-red-800">
              <span>جمع هزینه‌ها</span>
              <span className="text-red-700 dark:text-red-400">{formatCurrency(reportData.totalCost || 0, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Analysis */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-500" />
          تحلیل سود
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <span className="text-sm">جمع درآمدها</span>
            <span className="font-bold">{formatCurrency(reportData.totalIncome || 0, settings.currency)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <span className="text-sm">جمع هزینه‌ها</span>
            <span className="font-bold text-red-600">({formatCurrency(reportData.totalCost || 0, settings.currency)})</span>
          </div>
          <div className={`flex justify-between items-center p-4 rounded-lg font-bold text-lg border-2 ${
            reportData.netProfit >= 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <span>سود خالص</span>
            <span className={reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(reportData.netProfit || 0, settings.currency)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-xs text-slate-500 mb-1">حاشیه سود ناخالص</p>
              <p className="text-2xl font-bold text-blue-600">{grossMargin.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <p className="text-xs text-slate-500 mb-1">حاشیه سود خالص</p>
              <p className="text-2xl font-bold text-purple-600">{netMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Position */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Wallet size={20} className="text-green-500" />
          وضعیت مالی
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">موجودی نقدی</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(reportData.totalCash || 0, settings.currency)}</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">موجودی بانک</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(reportData.totalBank || 0, settings.currency)}</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">ارزش موجودی کالا</p>
            <p className="text-lg font-bold text-purple-600">{formatCurrency(reportData.inventoryValue || 0, settings.currency)}</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">مطالبات مشتریان</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(reportData.totalReceivables || 0, settings.currency)}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">بدهی به تأمین‌کنندگان</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(reportData.totalPayables || 0, settings.currency)}</p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">جمع دارایی‌های نقدی</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency((reportData.totalCash || 0) + (reportData.totalBank || 0), settings.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      {Object.keys(reportData.expenseBreakdown || {}).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4">جزئیات هزینه‌ها</h3>
          <div className="space-y-2">
            {Object.entries(reportData.expenseBreakdown).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">{category}</span>
                <span className="font-bold text-red-600">{formatCurrency(amount as number, settings.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales by Payment Method */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4">فروش بر اساس روش پرداخت</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-xs text-slate-500 mb-1">نقدی</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(reportData.salesByPayment?.cash || 0, settings.currency)}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-xs text-slate-500 mb-1">کارتخوان</p>
            <p className="text-sm font-bold text-blue-600">{formatCurrency(reportData.salesByPayment?.card || 0, settings.currency)}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
            <p className="text-xs text-slate-500 mb-1">نسیه</p>
            <p className="text-sm font-bold text-amber-600">{formatCurrency(reportData.salesByPayment?.credit || 0, settings.currency)}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
            <p className="text-xs text-slate-500 mb-1">ترکیبی</p>
            <p className="text-sm font-bold text-purple-600">{formatCurrency(reportData.salesByPayment?.mixed || 0, settings.currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

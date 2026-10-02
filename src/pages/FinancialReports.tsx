import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { financialDb } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { db } from '../lib/db';
import Button from '../components/ui/Button';
import { 
  FileText, Download, Printer, TrendingUp, TrendingDown, 
  DollarSign, PieChart, BarChart3, Activity
} from 'lucide-react';

export default function FinancialReports() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [reportType, setReportType] = useState<'pnl' | 'balance' | 'trial' | 'cashflow'>('pnl');

  const reports = [
    { id: 'pnl', label: 'سود و زیان', icon: TrendingUp, color: 'bg-green-500' },
    { id: 'balance', label: 'ترازنامه', icon: Activity, color: 'bg-blue-500' },
    { id: 'trial', label: 'تراز آزمایشی', icon: BarChart3, color: 'bg-purple-500' },
    { id: 'cashflow', label: 'جریان نقدی', icon: DollarSign, color: 'bg-amber-500' },
  ].filter(r => hasPermission('financial.reports'));

  const exportCSV = () => {
    // Implementation for CSV export
    const data = getReportData();
    const csv = data.map((row: any) => Object.values(row).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${reportType}_${Date.now()}.csv`;
    a.click();
  };

  const getReportData = () => {
    const accounts = financialDb.getAccounts();
    
    if (reportType === 'trial') {
      return accounts.filter(a => a.balance !== 0).map(a => ({
        code: a.code,
        name: a.name,
        debit: a.type === 'asset' || a.type === 'expense' ? Math.max(0, a.balance) : 0,
        credit: a.type === 'liability' || a.type === 'equity' || a.type === 'income' ? Math.max(0, a.balance) : 0,
      }));
    }

    return [];
  };

  // P&L Report
  const renderPnL = () => {
    const sales = AccountingService.getAccountBalance('4100');
    const repairIncome = AccountingService.getAccountBalance('4200');
    const serviceIncome = AccountingService.getAccountBalance('4300');
    const otherIncome = AccountingService.getAccountBalance('4400');
    const totalIncome = sales + repairIncome + serviceIncome + otherIncome;

    const cogs = AccountingService.getAccountBalance('5100');
    const grossProfit = totalIncome - cogs;

    const rent = AccountingService.getAccountBalance('5200');
    const salary = AccountingService.getAccountBalance('5300');
    const utilities = AccountingService.getAccountBalance('5400') + AccountingService.getAccountBalance('5500');
    const advertising = AccountingService.getAccountBalance('5600');
    const transport = AccountingService.getAccountBalance('5700');
    const maintenance = AccountingService.getAccountBalance('5800');
    const bankFees = AccountingService.getAccountBalance('5900');
    const otherExpenses = AccountingService.getAccountBalance('5990');
    const totalExpenses = rent + salary + utilities + advertising + transport + maintenance + bankFees + otherExpenses;

    const netProfit = grossProfit - totalExpenses;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome * 100) : 0;
    const netMargin = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">گزارش سود و زیان</h3>
          
          {/* Income */}
          <div className="mb-8">
            <h4 className="font-bold text-green-600 mb-3 text-lg flex items-center gap-2">
              <TrendingUp size={20} />
              درآمدها
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">فروش کالا</span>
                <span className="font-bold">{formatCurrency(sales, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">درآمد تعمیرات</span>
                <span className="font-bold">{formatCurrency(repairIncome, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">درآمد خدمات</span>
                <span className="font-bold">{formatCurrency(serviceIncome, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">سایر درآمدها</span>
                <span className="font-bold">{formatCurrency(otherIncome, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg font-bold border-2 border-green-200 dark:border-green-800">
                <span>جمع درآمدها</span>
                <span className="text-green-600">{formatCurrency(totalIncome, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* COGS */}
          <div className="mb-8">
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm">بهای تمام‌شده کالا</span>
              <span className="font-bold text-red-600">({formatCurrency(cogs, settings.currency)})</span>
            </div>
            <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg font-bold text-lg border-2 border-blue-200 dark:border-blue-800 mt-3">
              <span>سود ناخالص</span>
              <span className="text-green-600">{formatCurrency(grossProfit, settings.currency)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">حاشیه سود ناخالص: {grossMargin.toFixed(1)}%</p>
          </div>

          {/* Operating Expenses */}
          <div className="mb-8">
            <h4 className="font-bold text-red-600 mb-3 text-lg flex items-center gap-2">
              <TrendingDown size={20} />
              هزینه‌های عملیاتی
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">اجاره</span>
                <span className="font-bold">{formatCurrency(rent, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">حقوق</span>
                <span className="font-bold">{formatCurrency(salary, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">آب، برق، گاز، اینترنت و تلفن</span>
                <span className="font-bold">{formatCurrency(utilities, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">تبلیغات</span>
                <span className="font-bold">{formatCurrency(advertising, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">حمل‌ونقل</span>
                <span className="font-bold">{formatCurrency(transport, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">تعمیر و نگهداری</span>
                <span className="font-bold">{formatCurrency(maintenance, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">کارمزد بانکی</span>
                <span className="font-bold">{formatCurrency(bankFees, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">سایر هزینه‌ها</span>
                <span className="font-bold">{formatCurrency(otherExpenses, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg font-bold border-2 border-red-200 dark:border-red-800">
                <span>جمع هزینه‌ها</span>
                <span className="text-red-600">{formatCurrency(totalExpenses, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className={`p-6 rounded-2xl ${
            netProfit >= 0 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800' 
              : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">سود خالص</p>
                <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit, settings.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">حاشیه سود خالص</p>
                <p className={`text-2xl font-bold ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Balance Sheet
  const renderBalanceSheet = () => {
    const assets = financialDb.getAccounts().filter(a => a.type === 'asset');
    const liabilities = financialDb.getAccounts().filter(a => a.type === 'liability');
    const equity = financialDb.getAccounts().filter(a => a.type === 'equity');

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
    const netProfit = AccountingService.getNetProfit();

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">ترازنامه</h3>

          {/* Assets */}
          <div className="mb-8">
            <h4 className="font-bold text-blue-600 mb-3 text-lg flex items-center gap-2">
              <TrendingUp size={20} />
              دارایی‌ها
            </h4>
            <div className="space-y-2">
              {assets.filter(a => a.balance !== 0).map(a => (
                <div key={a.id} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-bold">{formatCurrency(a.balance, settings.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg font-bold border-2 border-blue-200 dark:border-blue-800">
                <span>جمع دارایی‌ها</span>
                <span className="text-blue-600">{formatCurrency(totalAssets, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div className="mb-8">
            <h4 className="font-bold text-red-600 mb-3 text-lg flex items-center gap-2">
              <TrendingDown size={20} />
              بدهی‌ها
            </h4>
            <div className="space-y-2">
              {liabilities.filter(a => a.balance !== 0).map(a => (
                <div key={a.id} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-bold">{formatCurrency(a.balance, settings.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg font-bold border-2 border-red-200 dark:border-red-800">
                <span>جمع بدهی‌ها</span>
                <span className="text-red-600">{formatCurrency(totalLiabilities, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="mb-8">
            <h4 className="font-bold text-purple-600 mb-3 text-lg flex items-center gap-2">
              <DollarSign size={20} />
              حقوق مالکانه
            </h4>
            <div className="space-y-2">
              {equity.filter(a => a.balance !== 0).map(a => (
                <div key={a.id} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-bold">{formatCurrency(a.balance, settings.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">سود جاری</span>
                <span className="font-bold">{formatCurrency(netProfit, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg font-bold border-2 border-purple-200 dark:border-purple-800">
                <span>جمع حقوق مالکانه</span>
                <span className="text-purple-600">{formatCurrency(totalEquity + netProfit, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className={`p-6 rounded-2xl ${
            AccountingService.verifyAccountingEquation()
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800'
              : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">جمع بدهی‌ها و حقوق مالکانه</p>
                <p className="text-2xl font-bold">{formatCurrency(totalLiabilities + totalEquity + netProfit, settings.currency)}</p>
              </div>
              <div className="text-right">
                {AccountingService.verifyAccountingEquation() ? (
                  <span className="text-sm text-green-600 font-medium">✓ ترازنامه متوازن است</span>
                ) : (
                  <span className="text-sm text-red-600 font-medium">✗ مغایرت در ترازنامه</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Trial Balance
  const renderTrialBalance = () => {
    const accounts = financialDb.getAccounts().filter(a => a.balance !== 0);
    const totalDebit = accounts.filter(a => a.type === 'asset' || a.type === 'expense').reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const totalCredit = accounts.filter(a => a.type === 'liability' || a.type === 'equity' || a.type === 'income').reduce((sum, a) => sum + Math.abs(a.balance), 0);

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">تراز آزمایشی</h3>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>کد</th>
                  <th>حساب</th>
                  <th className="text-left">بدهکار</th>
                  <th className="text-left">بستانکار</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => {
                  const isDebit = account.type === 'asset' || account.type === 'expense';
                  return (
                    <tr key={account.id}>
                      <td className="text-xs font-mono">{account.code}</td>
                      <td className="text-sm">{account.name}</td>
                      <td className="text-left">
                        {isDebit && account.balance > 0 ? (
                          <span className="text-blue-600 font-bold">{formatCurrency(account.balance, settings.currency)}</span>
                        ) : '-'}
                      </td>
                      <td className="text-left">
                        {!isDebit && account.balance > 0 ? (
                          <span className="text-green-600 font-bold">{formatCurrency(account.balance, settings.currency)}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-700 font-bold">
                  <td colSpan={2} className="px-3 py-3 text-sm">جمع</td>
                  <td className="px-3 py-3 text-left text-sm text-blue-600">{formatCurrency(totalDebit, settings.currency)}</td>
                  <td className="px-3 py-3 text-left text-sm text-green-600">{formatCurrency(totalCredit, settings.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 text-center">
            {Math.abs(totalDebit - totalCredit) < 1 ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">تراز آزمایشی متوازن است</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                <XCircle size={16} />
                <span className="text-sm font-medium">
                  مغایرت: {formatCurrency(Math.abs(totalDebit - totalCredit), settings.currency)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Cash Flow
  const renderCashFlow = () => {
    const sales = db.getSales().filter(s => s.status === 'completed');
    const cashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.paid, 0);
    const cardSales = sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.paid, 0);
    
    const expenses = financialDb.getExpenses();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const incomes = financialDb.getIncomeTransactions();
    const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);

    const netCashFlow = cashSales + cardSales + totalIncomes - totalExpenses;

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">گزارش جریان نقدی</h3>

          <div className="mb-8">
            <h4 className="font-bold text-green-600 mb-3 text-lg flex items-center gap-2">
              <TrendingUp size={20} />
              ورودی‌های نقدی
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">فروش نقدی</span>
                <span className="font-bold">{formatCurrency(cashSales, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">فروش کارتخوان</span>
                <span className="font-bold">{formatCurrency(cardSales, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">سایر درآمدها</span>
                <span className="font-bold">{formatCurrency(totalIncomes, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg font-bold border-2 border-green-200 dark:border-green-800">
                <span>جمع ورودی‌ها</span>
                <span className="text-green-600">{formatCurrency(cashSales + cardSales + totalIncomes, settings.currency)}</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="font-bold text-red-600 mb-3 text-lg flex items-center gap-2">
              <TrendingDown size={20} />
              خروجی‌های نقدی
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm">هزینه‌ها</span>
                <span className="font-bold">{formatCurrency(totalExpenses, settings.currency)}</span>
              </div>
              <div className="flex justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg font-bold border-2 border-red-200 dark:border-red-800">
                <span>جمع خروجی‌ها</span>
                <span className="text-red-600">{formatCurrency(totalExpenses, settings.currency)}</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${
            netCashFlow >= 0 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800' 
              : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">جریان نقدی خالص</p>
                <p className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netCashFlow, settings.currency)}
                </p>
              </div>
              <div className="text-right">
                {netCashFlow >= 0 ? (
                  <span className="text-sm text-green-600 font-medium">✓ جریان نقدی مثبت</span>
                ) : (
                  <span className="text-sm text-red-600 font-medium">✗ جریان نقدی منفی</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">گزارش‌های مالی</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">گزارش‌های جامع مالی و حسابداری</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download size={18} />
            اکسل
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={18} />
            چاپ
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reports.map(r => (
          <button
            key={r.id}
            onClick={() => setReportType(r.id as any)}
            className={`card p-4 transition-all ${
              reportType === r.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 ${r.color} rounded-xl flex items-center justify-center mb-2`}>
              <r.icon size={20} className="text-white" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{r.label}</p>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {reportType === 'pnl' && renderPnL()}
      {reportType === 'balance' && renderBalanceSheet()}
      {reportType === 'trial' && renderTrialBalance()}
      {reportType === 'cashflow' && renderCashFlow()}
    </div>
  );
}

function CheckCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

function XCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );
}

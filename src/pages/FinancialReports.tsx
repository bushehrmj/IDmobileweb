import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { financialDb } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { db } from '../lib/db';
import { FileText, Download, Printer } from 'lucide-react';

export default function FinancialReports() {
  const { hasPermission } = useAuth();
  const [reportType, setReportType] = useState<'pnl' | 'balance' | 'trial' | 'cashflow'>('pnl');
  const settings = db.getSettings();

  const reports = [
    { id: 'pnl', label: 'سود و زیان', show: hasPermission('financial.profit') },
    { id: 'balance', label: 'ترازنامه', show: hasPermission('financial.balance_sheet') },
    { id: 'trial', label: 'تراز آزمایشی', show: hasPermission('financial.reports') },
    { id: 'cashflow', label: 'جریان نقدی', show: hasPermission('financial.reports') },
  ].filter(r => r.show);

  const exportCSV = () => {
    // Implementation for CSV export
    const data = getReportData();
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
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
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4">گزارش سود و زیان</h3>
          
          {/* Income */}
          <div className="mb-6">
            <h4 className="font-bold text-green-600 mb-2">درآمدها</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>فروش کالا</span><span>{formatCurrency(sales, settings.currency)}</span></div>
              <div className="flex justify-between"><span>درآمد تعمیرات</span><span>{formatCurrency(repairIncome, settings.currency)}</span></div>
              <div className="flex justify-between"><span>درآمد خدمات</span><span>{formatCurrency(serviceIncome, settings.currency)}</span></div>
              <div className="flex justify-between"><span>سایر درآمدها</span><span>{formatCurrency(otherIncome, settings.currency)}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>جمع درآمدها</span>
                <span className="text-green-600">{formatCurrency(totalIncome, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* COGS */}
          <div className="mb-6">
            <div className="flex justify-between text-sm">
              <span>بهای تمام‌شده کالا</span>
              <span className="text-red-600">({formatCurrency(cogs, settings.currency)})</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t-2 border-slate-300 dark:border-slate-600 pt-2 mt-2">
              <span>سود ناخالص</span>
              <span className="text-green-600">{formatCurrency(grossProfit, settings.currency)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">حاشیه سود ناخالص: {grossMargin.toFixed(1)}%</p>
          </div>

          {/* Operating Expenses */}
          <div className="mb-6">
            <h4 className="font-bold text-red-600 mb-2">هزینه‌های عملیاتی</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>اجاره</span><span>{formatCurrency(rent, settings.currency)}</span></div>
              <div className="flex justify-between"><span>حقوق</span><span>{formatCurrency(salary, settings.currency)}</span></div>
              <div className="flex justify-between"><span>آب، برق، گاز، اینترنت و تلفن</span><span>{formatCurrency(utilities, settings.currency)}</span></div>
              <div className="flex justify-between"><span>تبلیغات</span><span>{formatCurrency(advertising, settings.currency)}</span></div>
              <div className="flex justify-between"><span>حمل‌ونقل</span><span>{formatCurrency(transport, settings.currency)}</span></div>
              <div className="flex justify-between"><span>تعمیر و نگهداری</span><span>{formatCurrency(maintenance, settings.currency)}</span></div>
              <div className="flex justify-between"><span>کارمزد بانکی</span><span>{formatCurrency(bankFees, settings.currency)}</span></div>
              <div className="flex justify-between"><span>سایر هزینه‌ها</span><span>{formatCurrency(otherExpenses, settings.currency)}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>جمع هزینه‌ها</span>
                <span className="text-red-600">{formatCurrency(totalExpenses, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex justify-between font-bold text-xl">
              <span>سود خالص</span>
              <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(netProfit, settings.currency)}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">حاشیه سود خالص: {netMargin.toFixed(1)}%</p>
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
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4">ترازنامه</h3>

          {/* Assets */}
          <div className="mb-6">
            <h4 className="font-bold text-blue-600 mb-2">دارایی‌ها</h4>
            <div className="space-y-1 text-sm">
              {assets.filter(a => a.balance !== 0).map(a => (
                <div key={a.id} className="flex justify-between">
                  <span>{a.name}</span>
                  <span>{formatCurrency(a.balance, settings.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>جمع دارایی‌ها</span>
                <span className="text-blue-600">{formatCurrency(totalAssets, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div className="mb-6">
            <h4 className="font-bold text-red-600 mb-2">بدهی‌ها</h4>
            <div className="space-y-1 text-sm">
              {liabilities.filter(a => a.balance !== 0).map(a => (
                <div key={a.id} className="flex justify-between">
                  <span>{a.name}</span>
                  <span>{formatCurrency(a.balance, settings.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>جمع بدهی‌ها</span>
                <span className="text-red-600">{formatCurrency(totalLiabilities, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="mb-6">
            <h4 className="font-bold text-purple-600 mb-2">حقوق مالکانه</h4>
            <div className="space-y-1 text-sm">
              {equity.filter(a => a.balance !== 0).map(a => (
                <div key={a.id} className="flex justify-between">
                  <span>{a.name}</span>
                  <span>{formatCurrency(a.balance, settings.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span>سود جاری</span>
                <span>{formatCurrency(netProfit, settings.currency)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>جمع حقوق مالکانه</span>
                <span className="text-purple-600">{formatCurrency(totalEquity + netProfit, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <div className="flex justify-between font-bold text-lg">
              <span>جمع بدهی‌ها و حقوق مالکانه</span>
              <span>{formatCurrency(totalLiabilities + totalEquity + netProfit, settings.currency)}</span>
            </div>
            <div className="mt-2 text-center">
              {AccountingService.verifyAccountingEquation() ? (
                <span className="text-sm text-green-600">✓ ترازنامه متوازن است</span>
              ) : (
                <span className="text-sm text-red-600">✗ مغایرت در ترازنامه</span>
              )}
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
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4">تراز آزمایشی</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-3 py-2 text-right">کد</th>
                  <th className="px-3 py-2 text-right">حساب</th>
                  <th className="px-3 py-2 text-left">بدهکار</th>
                  <th className="px-3 py-2 text-left">بستانکار</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => {
                  const isDebit = account.type === 'asset' || account.type === 'expense';
                  return (
                    <tr key={account.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-3 py-2 text-xs">{account.code}</td>
                      <td className="px-3 py-2">{account.name}</td>
                      <td className="px-3 py-2 text-left">
                        {isDebit && account.balance > 0 ? formatCurrency(account.balance, settings.currency) : '-'}
                      </td>
                      <td className="px-3 py-2 text-left">
                        {!isDebit && account.balance > 0 ? formatCurrency(account.balance, settings.currency) : '-'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-bold">
                  <td className="px-3 py-2" colSpan={2}>جمع</td>
                  <td className="px-3 py-2 text-left">{formatCurrency(totalDebit, settings.currency)}</td>
                  <td className="px-3 py-2 text-left">{formatCurrency(totalCredit, settings.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-center">
            {Math.abs(totalDebit - totalCredit) < 1 ? (
              <span className="text-sm text-green-600">✓ تراز آزمایشی متوازن است</span>
            ) : (
              <span className="text-sm text-red-600">✗ مغایرت: {formatCurrency(Math.abs(totalDebit - totalCredit), settings.currency)}</span>
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

    const netCashFlow = cashSales + totalIncomes - totalExpenses;

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4">گزارش جریان نقدی</h3>

          <div className="mb-6">
            <h4 className="font-bold text-green-600 mb-2">ورودی‌های نقدی</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>فروش نقدی</span><span>{formatCurrency(cashSales, settings.currency)}</span></div>
              <div className="flex justify-between"><span>فروش کارتخوان</span><span>{formatCurrency(cardSales, settings.currency)}</span></div>
              <div className="flex justify-between"><span>سایر درآمدها</span><span>{formatCurrency(totalIncomes, settings.currency)}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>جمع ورودی‌ها</span>
                <span className="text-green-600">{formatCurrency(cashSales + cardSales + totalIncomes, settings.currency)}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-red-600 mb-2">خروجی‌های نقدی</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>هزینه‌ها</span><span>{formatCurrency(totalExpenses, settings.currency)}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>جمع خروجی‌ها</span>
                <span className="text-red-600">{formatCurrency(totalExpenses, settings.currency)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex justify-between font-bold text-xl">
              <span>جریان نقدی خالص</span>
              <span className={netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(netCashFlow, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">گزارش‌های مالی</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Download size={14} /> اکسل
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Printer size={14} /> چاپ
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {reports.map(r => (
          <button key={r.id} onClick={() => setReportType(r.id as any)}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${reportType === r.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
            <FileText size={14} /> {r.label}
          </button>
        ))}
      </div>

      {reportType === 'pnl' && renderPnL()}
      {reportType === 'balance' && renderBalanceSheet()}
      {reportType === 'trial' && renderTrialBalance()}
      {reportType === 'cashflow' && renderCashFlow()}
    </div>
  );
}

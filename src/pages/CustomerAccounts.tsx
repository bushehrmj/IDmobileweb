import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { db, type Customer } from '../lib/db';
import { Users, Download, Printer } from 'lucide-react';

export default function CustomerAccounts() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setCustomers(db.getCustomers());
  }, []);

  const filtered = customers.filter(c =>
    c.firstName.includes(search) || c.lastName.includes(search) || c.mobile?.includes(search)
  );

  const totalReceivables = customers.reduce((sum, c) => sum + c.debt, 0);
  const totalCustomers = customers.length;
  const debtorsCount = customers.filter(c => c.debt > 0).length;

  // Aging report
  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    over90: 0,
  };

  customers.forEach(c => {
    if (c.debt <= 0) return;
    const lastPurchase = c.lastPurchase ? new Date(c.lastPurchase) : new Date();
    const daysSince = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 30) aging.current += c.debt;
    else if (daysSince <= 60) aging.days30 += c.debt;
    else if (daysSince <= 90) aging.days60 += c.debt;
    else if (daysSince <= 120) aging.days90 += c.debt;
    else aging.over90 += c.debt;
  });

  const exportCSV = () => {
    const headers = ['نام', 'نام خانوادگی', 'موبایل', 'کل خرید', 'پرداخت', 'بدهی', 'تعداد فاکتور'];
    const rows = customers.map(c => [
      c.firstName, c.lastName, c.mobile || '',
      c.totalPurchase.toString(), c.totalPaid.toString(), c.debt.toString(),
      c.invoiceCount.toString(),
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_accounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users size={20} className="text-blue-500" />
          حساب مشتریان
        </h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Download size={14} /> اکسل
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Printer size={14} /> چاپ
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">تعداد مشتریان</p>
          <p className="text-lg font-bold">{totalCustomers}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">مشتریان بدهکار</p>
          <p className="text-lg font-bold text-amber-600">{debtorsCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">مطالبات</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(totalReceivables, settings.currency)}</p>
        </div>
      </div>

      {/* Aging Report */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-sm mb-3">گزارش سنی مطالبات</h3>
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-[10px] text-slate-500">جاری</p>
            <p className="text-xs font-bold">{formatCurrency(aging.current, settings.currency)}</p>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-[10px] text-slate-500">31-60 روز</p>
            <p className="text-xs font-bold">{formatCurrency(aging.days30, settings.currency)}</p>
          </div>
          <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-[10px] text-slate-500">61-90 روز</p>
            <p className="text-xs font-bold">{formatCurrency(aging.days60, settings.currency)}</p>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-[10px] text-slate-500">91-120 روز</p>
            <p className="text-xs font-bold">{formatCurrency(aging.days90, settings.currency)}</p>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-[10px] text-slate-500">+120 روز</p>
            <p className="text-xs font-bold">{formatCurrency(aging.over90, settings.currency)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="جستجو نام، موبایل..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />

      {/* Customers List */}
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-slate-500 mt-1">{c.mobile}</p>
                <p className="text-xs text-slate-400">{c.invoiceCount} فاکتور</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500">خرید: {formatCurrency(c.totalPurchase, settings.currency)}</p>
                {c.debt > 0 && (
                  <p className="text-sm font-bold text-red-600">بدهی: {formatCurrency(c.debt, settings.currency)}</p>
                )}
                {c.debt === 0 && (
                  <p className="text-sm font-bold text-green-600">تسویه شده ✓</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">مشتری‌ای یافت نشد</p>}
      </div>
    </div>
  );
}

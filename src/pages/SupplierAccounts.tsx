import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { db, type Purchase } from '../lib/db';
import { Truck, Download, Printer } from 'lucide-react';

interface SupplierSummary {
  name: string;
  totalPurchases: number;
  totalPaid: number;
  debt: number;
  purchaseCount: number;
  lastPurchase?: string;
}

export default function SupplierAccounts() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    const purchases = db.getPurchases();
    const supplierMap: Record<string, SupplierSummary> = {};

    purchases.forEach(p => {
      if (!supplierMap[p.supplierName]) {
        supplierMap[p.supplierName] = {
          name: p.supplierName,
          totalPurchases: 0,
          totalPaid: 0,
          debt: 0,
          purchaseCount: 0,
        };
      }
      supplierMap[p.supplierName].totalPurchases += p.total;
      supplierMap[p.supplierName].totalPaid += p.paid;
      supplierMap[p.supplierName].debt += p.remaining;
      supplierMap[p.supplierName].purchaseCount += 1;
      if (!supplierMap[p.supplierName].lastPurchase || new Date(p.date) > new Date(supplierMap[p.supplierName].lastPurchase!)) {
        supplierMap[p.supplierName].lastPurchase = p.date;
      }
    });

    setSuppliers(Object.values(supplierMap));
  };

  const filtered = suppliers.filter(s => s.name.includes(search));

  const totalPayables = suppliers.reduce((sum, s) => sum + s.debt, 0);
  const totalSuppliers = suppliers.length;
  const creditorsCount = suppliers.filter(s => s.debt > 0).length;

  const exportCSV = () => {
    const headers = ['نام تأمین‌کننده', 'کل خرید', 'پرداخت', 'بدهی', 'تعداد خرید'];
    const rows = suppliers.map(s => [
      s.name, s.totalPurchases.toString(), s.totalPaid.toString(),
      s.debt.toString(), s.purchaseCount.toString(),
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier_accounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Truck size={20} className="text-blue-500" />
          حساب تأمین‌کنندگان
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
          <p className="text-xs text-slate-500">تعداد تأمین‌کنندگان</p>
          <p className="text-lg font-bold">{totalSuppliers}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">بستانکاران</p>
          <p className="text-lg font-bold text-amber-600">{creditorsCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">بدهی به تأمین‌کنندگان</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(totalPayables, settings.currency)}</p>
        </div>
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="جستجو نام تأمین‌کننده..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />

      {/* Suppliers List */}
      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.name} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{s.name}</p>
                <p className="text-xs text-slate-500 mt-1">{s.purchaseCount} خرید</p>
                {s.lastPurchase && <p className="text-xs text-slate-400">آخرین: {toJalali(s.lastPurchase)}</p>}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500">خرید: {formatCurrency(s.totalPurchases, settings.currency)}</p>
                <p className="text-xs text-slate-500">پرداخت: {formatCurrency(s.totalPaid, settings.currency)}</p>
                {s.debt > 0 ? (
                  <p className="text-sm font-bold text-red-600">بدهی: {formatCurrency(s.debt, settings.currency)}</p>
                ) : (
                  <p className="text-sm font-bold text-green-600">تسویه شده ✓</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">تأمین‌کننده‌ای یافت نشد</p>}
      </div>
    </div>
  );
}

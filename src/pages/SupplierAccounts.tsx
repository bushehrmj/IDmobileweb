import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { db, type Purchase } from '../lib/db';
import Button from '../components/ui/Button';
import { Truck, Download, Printer, Search, DollarSign } from 'lucide-react';

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
  const [debtFilter, setDebtFilter] = useState('all');

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

  const filtered = suppliers.filter(s => {
    const matchSearch = s.name.includes(search);
    const matchDebt = debtFilter === 'all' || 
                     (debtFilter === 'debt' && s.debt > 0) ||
                     (debtFilter === 'clear' && s.debt === 0);
    return matchSearch && matchDebt;
  });

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
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">حساب تأمین‌کنندگان</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت حساب‌ها و بدهی به تأمین‌کنندگان</p>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">تعداد تأمین‌کنندگان</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSuppliers}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">بستانکاران</p>
              <p className="text-2xl font-bold text-amber-600">{creditorsCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">بدهی به تأمین‌کنندگان</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalPayables, settings.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">جستجو و فیلتر</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو نام تأمین‌کننده..." 
              className="input pr-12" 
            />
          </div>
          <select 
            value={debtFilter} 
            onChange={e => setDebtFilter(e.target.value)}
            className="input"
          >
            <option value="all">همه تأمین‌کنندگان</option>
            <option value="debt">بستانکاران</option>
            <option value="clear">تسویه شده</option>
          </select>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="space-y-3">
        {filtered.map(s => (
          <div key={s.name} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Truck size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.purchaseCount} خرید</p>
                    {s.lastPurchase && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">آخرین: {toJalali(s.lastPurchase)}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 dark:text-slate-400">خرید: {formatCurrency(s.totalPurchases, settings.currency)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">پرداخت: {formatCurrency(s.totalPaid, settings.currency)}</p>
                {s.debt > 0 ? (
                  <p className="text-lg font-bold text-red-600 mt-2">بدهی: {formatCurrency(s.debt, settings.currency)}</p>
                ) : (
                  <p className="text-lg font-bold text-green-600 mt-2">تسویه شده ✓</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Truck size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">تأمین‌کننده‌ای یافت نشد</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {search || debtFilter !== 'all' 
                ? 'فیلترهای خود را تغییر دهید' 
                : 'هنوز خریدی ثبت نشده است'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db } from '../lib/db';
import { BarChart3, TrendingUp, Package, Users, Wrench, DollarSign } from 'lucide-react';

export default function Reports() {
  const { hasPermission, user } = useAuth();
  const settings = db.getSettings();
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const getReportData = () => {
    const from = dateFrom ? new Date(dateFrom) : new Date(0);
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();

    switch (reportType) {
      case 'sales': {
        const sales = db.getSales().filter(s => s.status === 'completed' && new Date(s.date) >= from && new Date(s.date) <= to);
        const totalSales = sales.reduce((s, sale) => s + sale.total, 0);
        const totalProfit = hasPermission('sales.view_profit') ? sales.reduce((s, sale) => s + sale.items.reduce((is, item) => is + (item.sellPrice - item.buyPrice) * item.quantity, 0), 0) : 0;
        return { total: sales.length, totalSales, totalProfit, items: sales };
      }
      case 'purchases': {
        const purchases = db.getPurchases().filter(p => new Date(p.date) >= from && new Date(p.date) <= to);
        const totalPurchases = purchases.reduce((s, p) => s + p.total, 0);
        return { total: purchases.length, totalPurchases, items: purchases };
      }
      case 'repairs': {
        const repairs = db.getRepairs().filter(r => new Date(r.createdAt) >= from && new Date(r.createdAt) <= to);
        const totalIncome = repairs.filter(r => r.status === 'delivered').reduce((s, r) => s + r.totalCost, 0);
        const totalLabor = repairs.reduce((s, r) => s + r.labor, 0);
        return { total: repairs.length, totalIncome, totalLabor, items: repairs };
      }
      case 'customers': {
        const customers = db.getCustomers();
        const totalDebt = customers.reduce((s, c) => s + c.debt, 0);
        return { total: customers.length, totalDebt, items: customers.filter(c => c.debt > 0) };
      }
      case 'inventory': {
        const products = db.getProducts();
        const totalValue = hasPermission('sales.view_profit') ? products.reduce((s, p) => s + p.buyPrice * p.stock, 0) : 0;
        const lowStock = products.filter(p => p.stock <= p.minStock && p.minStock > 0);
        return { total: products.length, totalValue, lowStock: lowStock.length, items: products };
      }
      case 'sellers': {
        const sales = db.getSales().filter(s => s.status === 'completed' && new Date(s.date) >= from && new Date(s.date) <= to);
        const sellerMap: Record<string, { name: string; count: number; total: number; discount: number }> = {};
        sales.forEach(s => {
          if (!sellerMap[s.sellerId]) sellerMap[s.sellerId] = { name: s.sellerName, count: 0, total: 0, discount: 0 };
          sellerMap[s.sellerId].count++;
          sellerMap[s.sellerId].total += s.total;
          sellerMap[s.sellerId].discount += s.discount;
        });
        return { items: Object.values(sellerMap) };
      }
      default: return { items: [] };
    }
  };

  const data: any = getReportData();

  const reports = [
    { id: 'sales', label: 'گزارش فروش', icon: TrendingUp, perm: 'sales.view' },
    { id: 'purchases', label: 'گزارش خرید', icon: DollarSign, perm: 'purchases.view' },
    { id: 'repairs', label: 'گزارش تعمیرات', icon: Wrench, perm: 'repairs.view' },
    { id: 'customers', label: 'گزارش مشتریان', icon: Users, perm: 'customers.view' },
    { id: 'inventory', label: 'گزارش موجودی', icon: Package, perm: 'inventory.view' },
    { id: 'sellers', label: 'گزارش فروشندگان', icon: BarChart3, perm: 'reports.view' },
  ].filter(r => hasPermission(r.perm));

  const exportCSV = () => {
    if (!data.items || data.items.length === 0) return;
    const headers = Object.keys(data.items[0] as Record<string, unknown>).join(',');
    const rows = (data.items as Record<string, unknown>[]).map(item => Object.values(item).join(','));
    const csv = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${reportType}_${Date.now()}.csv`; a.click();
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <h2 className="text-lg font-bold">گزارش‌ها</h2>

      <div className="flex flex-wrap gap-2">
        {reports.map(r => (
          <button key={r.id} onClick={() => setReportType(r.id)}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${reportType === r.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
            <r.icon size={14} /> {r.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
        <span className="text-sm text-slate-500">تا</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
        <button onClick={exportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">خروجی CSV</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportType === 'sales' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">تعداد فاکتور</p>
              <p className="text-lg font-bold">{data.total}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">جمع فروش</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(data.totalSales || 0, settings.currency)}</p>
            </div>
            {hasPermission('sales.view_profit') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500">سود</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(data.totalProfit || 0, settings.currency)}</p>
              </div>
            )}
          </>
        )}
        {reportType === 'repairs' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">تعداد تعمیر</p>
              <p className="text-lg font-bold">{data.total}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">درآمد</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(data.totalIncome || 0, settings.currency)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">اجرت</p>
              <p className="text-lg font-bold">{formatCurrency(data.totalLabor || 0, settings.currency)}</p>
            </div>
          </>
        )}
        {reportType === 'inventory' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">تعداد کالا</p>
              <p className="text-lg font-bold">{data.total}</p>
            </div>
            {hasPermission('sales.view_profit') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500">ارزش انبار</p>
                <p className="text-lg font-bold">{formatCurrency(data.totalValue || 0, settings.currency)}</p>
              </div>
            )}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">موجودی کم</p>
              <p className="text-lg font-bold text-red-500">{data.lowStock || 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Items list */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {data.items && (data.items as Record<string, unknown>[]).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  {Object.keys((data.items as Record<string, unknown>[])[0]).slice(0, 6).map(key => (
                    <th key={key} className="px-3 py-2 text-right text-xs font-medium text-slate-500">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.items as Record<string, unknown>[]).slice(0, 50).map((item, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                    {Object.values(item).slice(0, 6).map((val, j) => (
                      <td key={j} className="px-3 py-2 text-xs">{typeof val === 'number' ? formatCurrency(val as number, settings.currency) : String(val || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">داده‌ای یافت نشد</p>
        )}
      </div>
    </div>
  );
}

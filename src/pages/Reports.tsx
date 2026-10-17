import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { db } from '../lib/db';
import Button from '../components/ui/Button';
import { 
  BarChart3, TrendingUp, TrendingDown, Package, Users, Wrench,
  DollarSign, FileText, Download, Printer, Calendar, Filter
} from 'lucide-react';

export default function Reports() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    generateReport();
  }, [reportType, dateFrom, dateTo]);

  const generateReport = () => {
    const from = dateFrom ? new Date(dateFrom) : new Date(0);
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();

    let data: any = {};

    switch (reportType) {
      case 'sales': {
        const sales = db.getSales().filter(s => 
          s.status === 'completed' && 
          new Date(s.date) >= from && 
          new Date(s.date) <= to
        );
        const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
        const totalProfit = hasPermission('sales.view_profit') 
          ? sales.reduce((sum, sale) => {
              return sum + sale.items.reduce((itemSum, item) => {
                return itemSum + ((item.sellPrice - item.buyPrice) * item.quantity);
              }, 0);
            }, 0)
          : 0;
        
        data = {
          type: 'sales',
          count: sales.length,
          total: totalSales,
          profit: totalProfit,
          items: sales,
        };
        break;
      }

      case 'purchases': {
        const purchases = db.getPurchases().filter(p => 
          new Date(p.date) >= from && 
          new Date(p.date) <= to
        );
        const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
        
        data = {
          type: 'purchases',
          count: purchases.length,
          total: totalPurchases,
          items: purchases,
        };
        break;
      }

      case 'repairs': {
        const repairs = db.getRepairs().filter(r => 
          new Date(r.createdAt) >= from && 
          new Date(r.createdAt) <= to
        );
        const totalIncome = repairs
          .filter(r => r.status === 'delivered')
          .reduce((sum, r) => sum + (r.finalTotal || r.totalCost || 0), 0);
        const totalLabor = repairs.reduce((sum, r) => sum + (r.labor || 0), 0);
        
        data = {
          type: 'repairs',
          count: repairs.length,
          totalIncome,
          totalLabor,
          items: repairs,
        };
        break;
      }

      case 'customers': {
        const customers = db.getCustomers();
        const totalDebt = customers.reduce((sum, c) => sum + c.debt, 0);
        const debtors = customers.filter(c => c.debt > 0);
        
        data = {
          type: 'customers',
          total: customers.length,
          debtors: debtors.length,
          totalDebt,
          items: debtors,
        };
        break;
      }

      case 'inventory': {
        const products = db.getProducts();
        const totalValue = hasPermission('sales.view_profit')
          ? products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0)
          : 0;
        const lowStock = products.filter(p => p.stock <= p.minStock && p.minStock > 0);
        const outOfStock = products.filter(p => p.stock === 0);
        
        data = {
          type: 'inventory',
          total: products.length,
          totalValue,
          lowStock: lowStock.length,
          outOfStock: outOfStock.length,
          items: products,
        };
        break;
      }

      default:
        data = { type: reportType, items: [] };
    }

    setReportData(data);
  };

  const exportCSV = () => {
    if (!reportData || !reportData.items) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case 'sales':
        headers = ['شماره فاکتور', 'تاریخ', 'مشتری', 'مبلغ', 'سود'];
        rows = reportData.items.map((s: any) => [
          s.invoiceNumber,
          toJalali(s.date),
          s.customerName,
          s.total.toString(),
          hasPermission('sales.view_profit') 
            ? s.items.reduce((sum: number, item: any) => sum + ((item.sellPrice - item.buyPrice) * item.quantity), 0).toString()
            : 'N/A',
        ]);
        break;

      case 'purchases':
        headers = ['شماره فاکتور', 'تاریخ', 'تأمین‌کننده', 'مبلغ'];
        rows = reportData.items.map((p: any) => [
          p.invoiceNumber,
          toJalali(p.date),
          p.supplierName,
          p.total.toString(),
        ]);
        break;

      case 'repairs':
        headers = ['شماره تعمیر', 'تاریخ', 'مشتری', 'دستگاه', 'مبلغ'];
        rows = reportData.items.map((r: any) => [
          r.ticketNumber,
          toJalali(r.createdAt),
          r.customerName,
          `${r.brand} ${r.model}`,
          (r.finalTotal || r.totalCost || 0).toString(),
        ]);
        break;

      case 'customers':
        headers = ['نام', 'موبایل', 'کل خرید', 'پرداخت', 'بدهی'];
        rows = reportData.items.map((c: any) => [
          `${c.firstName} ${c.lastName}`,
          c.mobile || '',
          c.totalPurchase.toString(),
          c.totalPaid.toString(),
          c.debt.toString(),
        ]);
        break;

      case 'inventory':
        headers = ['نام کالا', 'برند', 'مدل', 'موجودی', 'قیمت خرید', 'قیمت فروش'];
        rows = reportData.items.map((p: any) => [
          p.name,
          p.brand || '',
          p.model || '',
          p.stock.toString(),
          p.buyPrice.toString(),
          p.sellPrice.toString(),
        ]);
        break;
    }

    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const reportTypes = [
    { id: 'sales', label: 'فروش', icon: TrendingUp, color: 'bg-blue-500' },
    { id: 'purchases', label: 'خرید', icon: TrendingDown, color: 'bg-purple-500' },
    { id: 'repairs', label: 'تعمیرات', icon: Wrench, color: 'bg-green-500' },
    { id: 'customers', label: 'مشتریان', icon: Users, color: 'bg-amber-500' },
    { id: 'inventory', label: 'انبار', icon: Package, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">گزارش‌ها</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">گزارش‌های جامع از عملیات فروشگاه</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {reportTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`card p-4 transition-all ${
              reportType === type.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center mb-2`}>
              <type.icon size={20} className="text-white" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{type.label}</p>
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">بازه زمانی</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">از تاریخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">تا تاریخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Report Summary */}
      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportType === 'sales' && (
            <>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تعداد فاکتور</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.count}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جمع فروش</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(reportData.total, settings.currency)}</p>
              </div>
              {hasPermission('sales.view_profit') && (
                <>
                  <div className="card p-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">سود</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(reportData.profit, settings.currency)}</p>
                  </div>
                  <div className="card p-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">حاشیه سود</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {reportData.total > 0 ? ((reportData.profit / reportData.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {reportType === 'purchases' && (
            <>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تعداد فاکتور</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.count}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جمع خرید</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(reportData.total, settings.currency)}</p>
              </div>
            </>
          )}

          {reportType === 'repairs' && (
            <>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تعداد تعمیر</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.count}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">درآمد</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(reportData.totalIncome, settings.currency)}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">اجرت</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(reportData.totalLabor, settings.currency)}</p>
              </div>
            </>
          )}

          {reportType === 'customers' && (
            <>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">کل مشتریان</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.total}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">بدهکاران</p>
                <p className="text-2xl font-bold text-amber-600">{reportData.debtors}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مطالبات</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(reportData.totalDebt, settings.currency)}</p>
              </div>
            </>
          )}

          {reportType === 'inventory' && (
            <>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">کل کالاها</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.total}</p>
              </div>
              {hasPermission('sales.view_profit') && (
                <div className="card p-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ارزش انبار</p>
                  <p className="text-lg font-bold text-indigo-600">{formatCurrency(reportData.totalValue, settings.currency)}</p>
                </div>
              )}
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">موجودی کم</p>
                <p className="text-2xl font-bold text-amber-600">{reportData.lowStock}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ناموجود</p>
                <p className="text-2xl font-bold text-red-600">{reportData.outOfStock}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Report Details */}
      {reportData && reportData.items && reportData.items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {reportType === 'sales' && (
                    <>
                      <th>شماره فاکتور</th>
                      <th>تاریخ</th>
                      <th>مشتری</th>
                      <th className="text-left">مبلغ</th>
                      {hasPermission('sales.view_profit') && <th className="text-left">سود</th>}
                    </>
                  )}
                  {reportType === 'purchases' && (
                    <>
                      <th>شماره فاکتور</th>
                      <th>تاریخ</th>
                      <th>تأمین‌کننده</th>
                      <th className="text-left">مبلغ</th>
                    </>
                  )}
                  {reportType === 'repairs' && (
                    <>
                      <th>شماره تعمیر</th>
                      <th>تاریخ</th>
                      <th>مشتری</th>
                      <th>دستگاه</th>
                      <th className="text-left">مبلغ</th>
                    </>
                  )}
                  {reportType === 'customers' && (
                    <>
                      <th>نام</th>
                      <th>موبایل</th>
                      <th className="text-left">کل خرید</th>
                      <th className="text-left">پرداخت</th>
                      <th className="text-left">بدهی</th>
                    </>
                  )}
                  {reportType === 'inventory' && (
                    <>
                      <th>نام کالا</th>
                      <th>برند</th>
                      <th className="text-center">موجودی</th>
                      {hasPermission('sales.view_profit') && (
                        <>
                          <th className="text-left">قیمت خرید</th>
                          <th className="text-left">قیمت فروش</th>
                        </>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportData.items.slice(0, 50).map((item: any, idx: number) => (
                  <tr key={idx}>
                    {reportType === 'sales' && (
                      <>
                        <td className="font-mono text-sm">#{item.invoiceNumber}</td>
                        <td className="text-sm">{toJalali(item.date)}</td>
                        <td className="text-sm">{item.customerName}</td>
                        <td className="text-left text-sm font-bold text-blue-600">
                          {formatCurrency(item.total, settings.currency)}
                        </td>
                        {hasPermission('sales.view_profit') && (
                          <td className="text-left text-sm font-bold text-green-600">
                            {formatCurrency(
                              item.items.reduce((sum: number, i: any) => sum + ((i.sellPrice - i.buyPrice) * i.quantity), 0),
                              settings.currency
                            )}
                          </td>
                        )}
                      </>
                    )}
                    {reportType === 'purchases' && (
                      <>
                        <td className="font-mono text-sm">#{item.invoiceNumber}</td>
                        <td className="text-sm">{toJalali(item.date)}</td>
                        <td className="text-sm">{item.supplierName}</td>
                        <td className="text-left text-sm font-bold text-purple-600">
                          {formatCurrency(item.total, settings.currency)}
                        </td>
                      </>
                    )}
                    {reportType === 'repairs' && (
                      <>
                        <td className="font-mono text-sm">#{item.ticketNumber}</td>
                        <td className="text-sm">{toJalali(item.createdAt)}</td>
                        <td className="text-sm">{item.customerName}</td>
                        <td className="text-sm">{item.brand} {item.model}</td>
                        <td className="text-left text-sm font-bold text-green-600">
                          {formatCurrency(item.finalTotal || item.totalCost || 0, settings.currency)}
                        </td>
                      </>
                    )}
                    {reportType === 'customers' && (
                      <>
                        <td className="text-sm font-medium">{item.firstName} {item.lastName}</td>
                        <td className="text-sm">{item.mobile || '-'}</td>
                        <td className="text-left text-sm">{formatCurrency(item.totalPurchase, settings.currency)}</td>
                        <td className="text-left text-sm">{formatCurrency(item.totalPaid, settings.currency)}</td>
                        <td className="text-left text-sm font-bold text-red-600">
                          {formatCurrency(item.debt, settings.currency)}
                        </td>
                      </>
                    )}
                    {reportType === 'inventory' && (
                      <>
                        <td className="text-sm font-medium">{item.name}</td>
                        <td className="text-sm">{item.brand || '-'}</td>
                        <td className="text-center text-sm font-bold">{item.stock}</td>
                        {hasPermission('sales.view_profit') && (
                          <>
                            <td className="text-left text-sm">{formatCurrency(item.buyPrice, settings.currency)}</td>
                            <td className="text-left text-sm">{formatCurrency(item.sellPrice, settings.currency)}</td>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reportData.items.length > 50 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-center text-sm text-slate-500 dark:text-slate-400">
              نمایش ۵۰ مورد اول از {reportData.items.length} مورد
            </div>
          )}
        </div>
      )}

      {reportData && reportData.items && reportData.items.length === 0 && (
        <div className="card p-12 text-center">
          <FileText size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">داده‌ای یافت نشد</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            بازه زمانی را تغییر دهید یا گزارش دیگری را انتخاب کنید
          </p>
        </div>
      )}
    </div>
  );
}

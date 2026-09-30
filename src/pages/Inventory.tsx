import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalaliFull } from '../lib/auth';
import { db, type StockMovement } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Package, ArrowDown, ArrowUp, Search, Filter, Download, Printer, FileSpreadsheet } from 'lucide-react';

export default function Inventory() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => { loadMovements(); }, []);
  const loadMovements = () => setMovements(db.getStockMovements().reverse());

  const filtered = movements.filter(m => {
    const matchSearch = m.productName.includes(search) || m.reference.includes(search);
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const adjustStock = () => {
    if (!adjustProduct) { showToast('error', 'کالا را انتخاب کنید'); return; }
    if (adjustQty === 0) { showToast('error', 'مقدار adjustment صفر است'); return; }

    const product = db.getProduct(adjustProduct);
    if (!product) return;

    product.stock += adjustQty;
    if (product.stock < 0) product.stock = 0;
    db.saveProduct(product);

    db.saveStockMovement({
      id: uuidv4(), productId: product.id, productName: product.name,
      type: 'adjustment', quantity: adjustQty,
      reference: 'adjustment', referenceType: 'adjustment', referenceId: '',
      userId: user?.id || '', userName: user?.fullName || '',
      date: new Date().toISOString(), notes: adjustNote,
    });

    db.addAuditLog({
      id: uuidv4(), userId: user?.id || '', userName: user?.fullName || '',
      action: 'adjust_stock', entity: 'product', entityId: product.id,
      newValue: `${product.name}: ${adjustQty > 0 ? '+' : ''}${adjustQty}`,
      ip: '127.0.0.1', date: new Date().toISOString(),
    });

    showToast('success', 'موجودی اصلاح شد');
    setShowAdjust(false);
    setAdjustProduct('');
    setAdjustQty(0);
    setAdjustNote('');
    loadMovements();
  };

  const products = db.getProducts();
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalValue = hasPermission('sales.view_profit') ? products.reduce((s, p) => s + p.buyPrice * p.stock, 0) : 0;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.minStock > 0).length;

  const exportToExcel = () => {
    const filteredProducts = search
      ? products.filter(p => p.name.includes(search) || p.brand.includes(search) || p.barcode?.includes(search))
      : products;
    
    const headers = ['نام کالا', 'برند', 'مدل', 'بارکد', 'موجودی', 'قیمت خرید', 'قیمت فروش', 'حداقل موجودی', 'وضعیت'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.brand,
      p.model,
      p.barcode || '',
      p.stock.toString(),
      p.buyPrice.toString(),
      p.sellPrice.toString(),
      p.minStock.toString(),
      p.status === 'active' ? 'فعال' : 'غیرفعال'
    ]);
    
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'فایل اکسل دانلود شد');
  };

  const printInventory = () => {
    const filteredProducts = search
      ? products.filter(p => p.name.includes(search) || p.brand.includes(search) || p.barcode?.includes(search))
      : products;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>گزارش انبار</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; padding: 20px; direction: rtl; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .info { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>گزارش موجودی انبار</h1>
        <div class="info">
          <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
          <p>تعداد کل کالاها: ${filteredProducts.length}</p>
          <p>موجودی کل: ${totalStock}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام کالا</th>
              <th>برند</th>
              <th>مدل</th>
              <th>بارکد</th>
              <th>موجودی</th>
              <th>قیمت خرید</th>
              <th>قیمت فروش</th>
            </tr>
          </thead>
          <tbody>
            ${filteredProducts.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.brand}</td>
                <td>${p.model}</td>
                <td>${p.barcode || '-'}</td>
                <td>${p.stock}</td>
                <td>${formatCurrency(p.buyPrice, settings.currency)}</td>
                <td>${formatCurrency(p.sellPrice, settings.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">انبار</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportToExcel} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
            <FileSpreadsheet size={16} /> خروجی اکسل
          </button>
          <button onClick={printInventory} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Printer size={16} /> چاپ گزارش
          </button>
          {hasPermission('inventory.adjust') && (
            <button onClick={() => setShowAdjust(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
              <Package size={16} /> اصلاح موجودی
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">کل موجودی</p>
          <p className="text-lg font-bold">{totalStock}</p>
        </div>
        {hasPermission('sales.view_profit') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500">ارزش انبار</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalValue, settings.currency)}</p>
          </div>
        )}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">موجودی کم</p>
          <p className="text-lg font-bold text-red-500">{lowStockCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="جستجو..." className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
          <option value="all">همه</option>
          <option value="in">ورود</option>
          <option value="out">خروج</option>
          <option value="adjustment">اصلاح</option>
          <option value="return">مرجوعی</option>
        </select>
      </div>

      {/* Movements */}
      <div className="space-y-2">
        {filtered.slice(0, 50).map(m => (
          <div key={m.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {m.type === 'in' || m.type === 'return' ? (
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ArrowDown size={14} className="text-green-600" />
                </div>
              ) : m.type === 'out' ? (
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ArrowUp size={14} className="text-red-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Package size={14} className="text-blue-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{m.productName}</p>
                <p className="text-xs text-slate-500">{m.userName} | {toJalaliFull(m.date)}</p>
                {m.notes && <p className="text-xs text-slate-400">{m.notes}</p>}
              </div>
            </div>
            <div className="text-left">
              <p className={`text-sm font-bold ${m.type === 'in' || m.type === 'return' ? 'text-green-600' : m.type === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
                {m.type === 'in' || m.type === 'return' ? '+' : m.type === 'out' ? '-' : ''}{m.quantity}
              </p>
              <p className="text-[10px] text-slate-400">{m.reference}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">حرکتی ثبت نشده</p>}
      </div>

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-md p-4 space-y-3">
            <h3 className="font-bold">اصلاح موجودی</h3>
            <div>
              <label className="text-xs text-slate-500">کالا</label>
              <select value={adjustProduct} onChange={e => setAdjustProduct(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="">انتخاب کالا</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stock})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">مقدار (مثبت=افزایش، منفی=کاهش)</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
            <div>
              <label className="text-xs text-slate-500">دلیل</label>
              <input type="text" value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdjust(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm">انصراف</button>
              <button onClick={adjustStock} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">ثبت</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

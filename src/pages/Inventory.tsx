import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalaliFull } from '../lib/auth';
import { db, type StockMovement } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Package, ArrowDown, ArrowUp, Search, Download, Printer, FileSpreadsheet } from 'lucide-react';

export default function Inventory() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');
  const [activeTab, setActiveTab] = useState<'movements' | 'stock'>('movements');

  useEffect(() => { loadMovements(); }, []);
  const loadMovements = () => setMovements(db.getStockMovements().reverse());

  const filtered = movements.filter(m => {
    const matchSearch = m.productName.includes(search) || m.reference.includes(search) || m.userName.includes(search);
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    const date = new Date(m.date);
    const matchDateFrom = !dateFrom || date >= new Date(dateFrom);
    const matchDateTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchType && matchDateFrom && matchDateTo;
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

  // Export to Excel/CSV
  const exportToCSV = () => {
    const headers = ['تاریخ', 'نام کالا', 'نوع', 'تعداد', 'مرجع', 'کاربر', 'یادداشت'];
    const rows = filtered.map(m => [
      toJalaliFull(m.date),
      m.productName,
      m.type === 'in' ? 'ورود' : m.type === 'out' ? 'خروج' : m.type === 'adjustment' ? 'اصلاح' : m.type === 'return' ? 'مرجوعی' : m.type,
      m.quantity.toString(),
      m.reference,
      m.userName,
      m.notes || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'فایل اکسل دانلود شد');
  };

  // Export stock to CSV
  const exportStockToCSV = () => {
    const products = db.getProducts();
    const headers = ['نام کالا', 'برند', 'مدل', 'دسته‌بندی', 'موجودی', 'حداقل موجودی', 'قیمت خرید', 'قیمت فروش', 'بارکد'];
    const rows = products.map(p => [
      p.name, p.brand, p.model, p.category,
      p.stock.toString(), p.minStock.toString(),
      p.buyPrice.toString(), p.sellPrice.toString(), p.barcode || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'فایل موجودی دانلود شد');
  };

  // Print
  const handlePrint = () => window.print();

  const products = db.getProducts();
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalValue = hasPermission('sales.view_profit') ? products.reduce((s, p) => s + p.buyPrice * p.stock, 0) : 0;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.minStock > 0).length;

  // Filtered stock
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategory, setStockCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.includes(stockSearch) || p.brand.includes(stockSearch) || p.barcode?.includes(stockSearch);
    const matchCategory = stockCategory === 'all' || p.category === stockCategory;
    const matchStatus = stockStatus === 'all' ||
      (stockStatus === 'low' && p.stock <= p.minStock && p.minStock > 0) ||
      (stockStatus === 'out' && p.stock === 0) ||
      (stockStatus === 'ok' && p.stock > p.minStock);
    return matchSearch && matchCategory && matchStatus;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">انبار</h2>
        <div className="flex gap-2">
          {hasPermission('inventory.adjust') && (
            <button onClick={() => setShowAdjust(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
              <Package size={14} /> اصلاح موجودی
            </button>
          )}
          <button onClick={handlePrint} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm flex items-center gap-1 no-print">
            <Printer size={14} /> چاپ
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">کل کالاها</p>
          <p className="text-lg font-bold">{products.length}</p>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 no-print">
        <button onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'movements' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          حرکات انبار
        </button>
        <button onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'stock' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          موجودی کالاها
        </button>
      </div>

      {activeTab === 'movements' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 no-print">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو..." className="flex-1 min-w-[150px] px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
              <option value="all">همه انواع</option>
              <option value="in">ورود</option>
              <option value="out">خروج</option>
              <option value="adjustment">اصلاح</option>
              <option value="return">مرجوعی</option>
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
            <button onClick={exportToCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
              <FileSpreadsheet size={14} /> اکسل
            </button>
          </div>

          {/* Movements */}
          <div className="space-y-2">
            {filtered.slice(0, 100).map(m => (
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
            {filtered.length > 100 && <p className="text-center text-xs text-slate-400">نمایش ۱۰۰ مورد اول از {filtered.length}</p>}
          </div>
        </>
      )}

      {activeTab === 'stock' && (
        <>
          {/* Stock Filters */}
          <div className="flex flex-wrap gap-2 no-print">
            <input type="text" value={stockSearch} onChange={e => setStockSearch(e.target.value)}
              placeholder="جستجو نام، برند، بارکد..." className="flex-1 min-w-[150px] px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
            <select value={stockCategory} onChange={e => setStockCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
              <option value="all">همه دسته‌ها</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={stockStatus} onChange={e => setStockStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
              <option value="all">همه وضعیت‌ها</option>
              <option value="ok">موجودی کافی</option>
              <option value="low">موجودی کم</option>
              <option value="out">ناموجود</option>
            </select>
            <button onClick={exportStockToCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
              <FileSpreadsheet size={14} /> اکسل
            </button>
          </div>

          {/* Stock Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">کالا</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">برند/مدل</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">موجودی</th>
                    {hasPermission('sales.view_profit') && (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">قیمت خرید</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">قیمت فروش</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">ارزش</th>
                      </>
                    )}
                    <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-3 py-2">
                        <p className="text-xs font-medium">{p.name}</p>
                        {p.barcode && <p className="text-[10px] text-slate-400">{p.barcode}</p>}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{p.brand} {p.model}</td>
                      <td className="px-3 py-2 text-center text-xs font-bold">{p.stock}</td>
                      {hasPermission('sales.view_profit') && (
                        <>
                          <td className="px-3 py-2 text-left text-xs">{formatCurrency(p.buyPrice, settings.currency)}</td>
                          <td className="px-3 py-2 text-left text-xs">{formatCurrency(p.sellPrice, settings.currency)}</td>
                          <td className="px-3 py-2 text-left text-xs font-bold">{formatCurrency(p.buyPrice * p.stock, settings.currency)}</td>
                        </>
                      )}
                      <td className="px-3 py-2 text-center">
                        {p.stock === 0 ? (
                          <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded">ناموجود</span>
                        ) : p.stock <= p.minStock && p.minStock > 0 ? (
                          <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">کم</span>
                        ) : (
                          <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">موجود</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && <p className="text-center text-slate-500 py-8">کالایی یافت نشد</p>}
          </div>
        </>
      )}

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

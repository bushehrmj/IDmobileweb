import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalaliFull } from '../lib/auth';
import { db, type StockMovement } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import { 
  Package, ArrowDown, ArrowUp, Search, Filter, 
  Download, Printer, Plus, X, TrendingUp, AlertTriangle
} from 'lucide-react';

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

  const products = db.getProducts();
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalValue = hasPermission('sales.view_profit') ? products.reduce((s, p) => s + p.buyPrice * p.stock, 0) : 0;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.minStock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

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
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">انبار</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت موجودی و حرکات انبار</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('inventory.adjust') && (
            <Button variant="primary" onClick={() => setShowAdjust(true)}>
              <Plus size={18} />
              اصلاح موجودی
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={18} />
            چاپ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل کالاها</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل موجودی</p>
              <p className="text-xl font-bold text-green-600">{totalStock}</p>
            </div>
          </div>
        </div>
        {hasPermission('sales.view_profit') && (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">ارزش انبار</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalValue, settings.currency)}</p>
              </div>
            </div>
          </div>
        )}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">موجودی کم</p>
              <p className="text-xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 p-2">
          <button 
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'movements' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            حرکات انبار
          </button>
          <button 
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'stock' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            موجودی کالاها
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'movements' && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="جستجو..." 
                    className="input pr-12" 
                  />
                </div>
                <select 
                  value={typeFilter} 
                  onChange={e => setTypeFilter(e.target.value)}
                  className="input w-auto"
                >
                  <option value="all">همه انواع</option>
                  <option value="in">ورود</option>
                  <option value="out">خروج</option>
                  <option value="adjustment">اصلاح</option>
                  <option value="return">مرجوعی</option>
                </select>
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={e => setDateFrom(e.target.value)}
                  className="input w-auto" 
                />
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={e => setDateTo(e.target.value)}
                  className="input w-auto" 
                />
                <Button variant="success" onClick={exportToCSV}>
                  <Download size={18} />
                  اکسل
                </Button>
              </div>

              {/* Movements */}
              <div className="space-y-2">
                {filtered.slice(0, 100).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      {m.type === 'in' || m.type === 'return' ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <ArrowDown size={18} className="text-green-600" />
                        </div>
                      ) : m.type === 'out' ? (
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <ArrowUp size={18} className="text-red-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Package size={18} className="text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{m.productName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {m.userName} | {toJalaliFull(m.date)}
                        </p>
                        {m.notes && <p className="text-xs text-slate-400 dark:text-slate-500">{m.notes}</p>}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${
                        m.type === 'in' || m.type === 'return' ? 'text-green-600' : 
                        m.type === 'out' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {m.type === 'in' || m.type === 'return' ? '+' : m.type === 'out' ? '-' : ''}{m.quantity}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{m.reference}</p>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-12">
                    <Package size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium text-slate-500 dark:text-slate-400">حرکتی ثبت نشده</p>
                  </div>
                )}
                {filtered.length > 100 && (
                  <p className="text-center text-xs text-slate-400 py-2">
                    نمایش ۱۰۰ مورد اول از {filtered.length}
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'stock' && (
            <>
              {/* Stock Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <input 
                  type="text" 
                  value={stockSearch} 
                  onChange={e => setStockSearch(e.target.value)}
                  placeholder="جستجو نام، برند، بارکد..." 
                  className="input flex-1 min-w-[200px]" 
                />
                <select 
                  value={stockCategory} 
                  onChange={e => setStockCategory(e.target.value)}
                  className="input w-auto"
                >
                  <option value="all">همه دسته‌ها</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={stockStatus} 
                  onChange={e => setStockStatus(e.target.value)}
                  className="input w-auto"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="ok">موجودی کافی</option>
                  <option value="low">موجودی کم</option>
                  <option value="out">ناموجود</option>
                </select>
                <Button variant="success" onClick={exportStockToCSV}>
                  <Download size={18} />
                  اکسل
                </Button>
              </div>

              {/* Stock Table */}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>کالا</th>
                      <th>برند/مدل</th>
                      <th className="text-center">موجودی</th>
                      {hasPermission('sales.view_profit') && (
                        <>
                          <th className="text-left">قیمت خرید</th>
                          <th className="text-left">قیمت فروش</th>
                          <th className="text-left">ارزش</th>
                        </>
                      )}
                      <th className="text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <p className="text-sm font-medium">{p.name}</p>
                          {p.barcode && <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>}
                        </td>
                        <td className="text-sm text-slate-500">{p.brand} {p.model}</td>
                        <td className="text-center text-sm font-bold">{p.stock}</td>
                        {hasPermission('sales.view_profit') && (
                          <>
                            <td className="text-left text-sm">{formatCurrency(p.buyPrice, settings.currency)}</td>
                            <td className="text-left text-sm">{formatCurrency(p.sellPrice, settings.currency)}</td>
                            <td className="text-left text-sm font-bold">{formatCurrency(p.buyPrice * p.stock, settings.currency)}</td>
                          </>
                        )}
                        <td className="text-center">
                          {p.stock === 0 ? (
                            <span className="badge badge-error">ناموجود</span>
                          ) : p.stock <= p.minStock && p.minStock > 0 ? (
                            <span className="badge badge-warning">کم</span>
                          ) : (
                            <span className="badge badge-success">موجود</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-slate-500 dark:text-slate-400">کالایی یافت نشد</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">اصلاح موجودی</h3>
              <button onClick={() => setShowAdjust(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">کالا</label>
              <select 
                value={adjustProduct} 
                onChange={e => setAdjustProduct(e.target.value)}
                className="input"
              >
                <option value="">انتخاب کالا</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stock})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                مقدار (مثبت=افزایش، منفی=کاهش)
              </label>
              <input 
                type="number" 
                value={adjustQty} 
                onChange={e => setAdjustQty(Number(e.target.value))}
                className="input" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">دلیل</label>
              <input 
                type="text" 
                value={adjustNote} 
                onChange={e => setAdjustNote(e.target.value)}
                className="input" 
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdjust(false)}>
                انصراف
              </Button>
              <Button variant="primary" className="flex-1" onClick={adjustStock}>
                ثبت
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

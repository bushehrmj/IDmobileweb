import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalaliFull } from '../lib/auth';
import { 
  db, 
  type Product, 
  type StockMovement,
  recordStockMovement,
  getStockStatus,
  getProductMovementHistory,
  calculateTotalInventoryValue,
  calculateAverageBuyPrice
} from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Package, ArrowDown, ArrowUp, Search, Filter, 
  Download, Printer, Plus, X, TrendingUp, AlertTriangle,
  History, Edit, Eye, BarChart3, Calendar, CheckCircle
} from 'lucide-react';

export default function Inventory() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'reports'>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showMovementFilter, setShowMovementFilter] = useState(false);
  
  // Movement filters
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [movementDateFrom, setMovementDateFrom] = useState('');
  const [movementDateTo, setMovementDateTo] = useState('');
  const [movementProductFilter, setMovementProductFilter] = useState('');

  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    newStock: 0,
    reason: '',
  });

  // Stocktaking (انبارگردانی)
  const [showStocktaking, setShowStocktaking] = useState(false);
  const [stocktakingMode, setStocktakingMode] = useState<'full' | 'category' | 'product'>('full');
  const [stocktakingCategory, setStocktakingCategory] = useState('all');
  const [stocktakingProducts, setStocktakingProducts] = useState<Array<{
    productId: string;
    productName: string;
    systemStock: number;
    actualStock: number;
    difference: number;
    reason: string;
    checked: boolean;
  }>>([]);
  const [stocktakingStep, setStocktakingStep] = useState<'select' | 'count' | 'review' | 'complete'>('select');

  const products = db.getProducts();
  const movements = db.getStockMovements();

  // آمار کلی
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalValue = calculateTotalInventoryValue();
  const lowStockCount = products.filter(p => getStockStatus(p) === 'low').length;
  const outOfStockCount = products.filter(p => getStockStatus(p) === 'out').length;

  // فیلتر محصولات
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.includes(search) || p.brand.includes(search) || 
                       p.model?.includes(search) || p.barcode?.includes(search);
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || getStockStatus(p) === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // فیلتر حرکات
  const filteredMovements = movements.filter(m => {
    const matchType = movementTypeFilter === 'all' || m.type === movementTypeFilter;
    const matchProduct = !movementProductFilter || m.productName.includes(movementProductFilter);
    const date = new Date(m.date);
    const matchDateFrom = !movementDateFrom || date >= new Date(movementDateFrom);
    const matchDateTo = !movementDateTo || date <= new Date(movementDateTo + 'T23:59:59');
    return matchType && matchProduct && matchDateFrom && matchDateTo;
  }).reverse();

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // توابع انبارگردانی
  const startStocktaking = () => {
    let productsToCount = products;
    
    if (stocktakingMode === 'category' && stocktakingCategory !== 'all') {
      productsToCount = products.filter(p => p.category === stocktakingCategory);
    }
    
    const initialList = productsToCount.map(p => ({
      productId: p.id,
      productName: p.name,
      systemStock: p.stock,
      actualStock: p.stock,
      difference: 0,
      reason: '',
      checked: false,
    }));
    
    setStocktakingProducts(initialList);
    setStocktakingStep('count');
  };

  const updateStocktakingProduct = (productId: string, actualStock: number, reason: string) => {
    setStocktakingProducts(prev => 
      prev.map(p => {
        if (p.productId === productId) {
          const difference = actualStock - p.systemStock;
          return {
            ...p,
            actualStock,
            difference,
            reason,
            checked: true,
          };
        }
        return p;
      })
    );
  };

  const applyStocktakingResults = () => {
    const discrepancies = stocktakingProducts.filter(p => p.difference !== 0);
    
    if (discrepancies.length === 0) {
      showToast('success', 'انبارگردانی کامل شد - هیچ مغایرتی یافت نشد');
      setShowStocktaking(false);
      resetStocktaking();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    discrepancies.forEach(item => {
      try {
        recordStockMovement(
          item.productId,
          item.productName,
          'adjustment',
          item.actualStock,
          'انبارگردانی',
          'adjustment',
          '',
          user?.id || '',
          user?.fullName || '',
          item.reason || `مغایرت انبارگردانی: ${item.difference > 0 ? '+' : ''}${item.difference}`
        );
        successCount++;
      } catch (error: any) {
        console.error(`Error adjusting ${item.productName}:`, error);
        errorCount++;
      }
    });

    if (errorCount === 0) {
      showToast('success', `انبارگردانی با موفقیت انجام شد - ${successCount} کالا اصلاح شد`);
    } else {
      showToast('warning', `انبارگردانی انجام شد - ${successCount} موفق، ${errorCount} خطا`);
    }

    setShowStocktaking(false);
    resetStocktaking();
  };

  const resetStocktaking = () => {
    setStocktakingMode('full');
    setStocktakingCategory('all');
    setStocktakingProducts([]);
    setStocktakingStep('select');
  };

  const getStocktakingSummary = () => {
    const total = stocktakingProducts.length;
    const checked = stocktakingProducts.filter(p => p.checked).length;
    const discrepancies = stocktakingProducts.filter(p => p.difference !== 0);
    const positive = discrepancies.filter(p => p.difference > 0);
    const negative = discrepancies.filter(p => p.difference < 0);
    
    return {
      total,
      checked,
      discrepancies: discrepancies.length,
      positive: positive.length,
      negative: negative.length,
    };
  };

  const handleAdjustStock = () => {
    if (!adjustForm.productId) {
      showToast('error', 'کالا را انتخاب کنید');
      return;
    }
    if (adjustForm.newStock < 0) {
      showToast('error', 'موجودی نمی‌تواند منفی باشد');
      return;
    }
    if (!adjustForm.reason.trim()) {
      showToast('error', 'دلیل اصلاح را وارد کنید');
      return;
    }

    try {
      recordStockMovement(
        adjustForm.productId,
        products.find(p => p.id === adjustForm.productId)?.name || '',
        'adjustment',
        adjustForm.newStock,
        'adjustment',
        'adjustment',
        '',
        user?.id || '',
        user?.fullName || '',
        adjustForm.reason
      );

      showToast('success', 'موجودی اصلاح شد');
      setShowAdjust(false);
      setAdjustForm({ productId: '', newStock: 0, reason: '' });
    } catch (error: any) {
      showToast('error', error.message || 'خطا در اصلاح موجودی');
    }
  };

  const exportMovementsCSV = () => {
    const headers = ['تاریخ', 'کالا', 'نوع عملیات', 'مقدار', 'موجودی قبل', 'موجودی بعد', 'قیمت واحد', 'قیمت کل', 'مرجع', 'کاربر', 'توضیحات'];
    const rows = filteredMovements.map(m => [
      toJalaliFull(m.date),
      m.productName,
      m.type === 'in' ? 'ورود' : m.type === 'out' ? 'خروج' : m.type === 'adjustment' ? 'اصلاح' : m.type === 'return' ? 'مرجوعی' : m.type === 'repair' ? 'تعمیر' : m.type,
      m.quantity.toString(),
      (m.previousStock || 0).toString(),
      (m.newStock || 0).toString(),
      (m.unitPrice || 0).toString(),
      (m.totalPrice || 0).toString(),
      m.reference,
      m.userName,
      m.notes || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_movements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'فایل اکسل دانلود شد');
  };

  const exportStockCSV = () => {
    const headers = ['نام کالا', 'برند', 'مدل', 'دسته‌بندی', 'موجودی', 'حداقل موجودی', 'وضعیت', 'قیمت خرید', 'میانگین بهای خرید', 'آخرین قیمت خرید', 'قیمت فروش', 'ارزش موجودی', 'بارکد'];
    const rows = filteredProducts.map(p => [
      p.name, 
      p.brand || '', 
      p.model || '', 
      p.category || '',
      p.stock.toString(), 
      p.minStock.toString(),
      getStockStatus(p) === 'out' ? 'ناموجود' : getStockStatus(p) === 'low' ? 'کم' : 'موجود',
      p.buyPrice.toString(),
      (p.averageBuyPrice || p.buyPrice).toString(),
      (p.lastBuyPrice || p.buyPrice).toString(),
      p.sellPrice.toString(),
      ((p.averageBuyPrice || p.buyPrice) * p.stock).toString(),
      p.barcode || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_stock_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'فایل اکسل دانلود شد');
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      in: 'ورود',
      out: 'خروج',
      adjustment: 'اصلاح',
      return: 'مرجوعی',
      repair: 'تعمیر',
      damage: 'ضایعات',
      transfer: 'انتقال',
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      in: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      out: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      adjustment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      return: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      repair: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      damage: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      transfer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">انبار</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت موجودی و گردش کالا</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('inventory.adjust') && (
            <>
              <Button variant="success" onClick={() => setShowStocktaking(true)}>
                <Package size={18} />
                انبارگردانی
              </Button>
              <Button variant="primary" onClick={() => setShowAdjust(true)}>
                <Edit size={18} />
                اصلاح موجودی
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={18} />
            چاپ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل کالاها</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
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
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">ارزش انبار</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalValue, db.getSettings().currency)}</p>
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
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <X size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">ناموجود</p>
              <p className="text-xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 p-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            موجودی کالاها
          </button>
          <button 
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'movements' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            حرکات انبار ({movements.length})
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'reports' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            گزارش‌ها
          </button>
        </div>

        <div className="p-5">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="جستجو نام، برند، بارکد..." 
                    className="input pr-12" 
                  />
                </div>
                <select 
                  value={categoryFilter} 
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="input w-auto"
                >
                  <option value="all">همه دسته‌ها</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="input w-auto"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="ok">موجود</option>
                  <option value="low">کم</option>
                  <option value="out">ناموجود</option>
                </select>
                <Button variant="success" onClick={exportStockCSV}>
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
                      <th className="text-center">حداقل</th>
                      <th className="text-center">وضعیت</th>
                      {hasPermission('sales.view_profit') && (
                        <>
                          <th className="text-left">میانگین خرید</th>
                          <th className="text-left">قیمت فروش</th>
                          <th className="text-left">ارزش</th>
                        </>
                      )}
                      <th className="text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const status = getStockStatus(p);
                      return (
                        <tr key={p.id}>
                          <td>
                            <p className="text-sm font-medium">{p.name}</p>
                            {p.barcode && <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>}
                          </td>
                          <td className="text-sm text-slate-500">{p.brand} {p.model}</td>
                          <td className="text-center text-sm font-bold">{p.stock}</td>
                          <td className="text-center text-sm">{p.minStock}</td>
                          <td className="text-center">
                            {status === 'out' ? (
                              <span className="badge badge-error">ناموجود</span>
                            ) : status === 'low' ? (
                              <span className="badge badge-warning">کم</span>
                            ) : (
                              <span className="badge badge-success">موجود</span>
                            )}
                          </td>
                          {hasPermission('sales.view_profit') && (
                            <>
                              <td className="text-left text-sm">{formatCurrency(p.averageBuyPrice || p.buyPrice, db.getSettings().currency)}</td>
                              <td className="text-left text-sm">{formatCurrency(p.sellPrice, db.getSettings().currency)}</td>
                              <td className="text-left text-sm font-bold">{formatCurrency((p.averageBuyPrice || p.buyPrice) * p.stock, db.getSettings().currency)}</td>
                            </>
                          )}
                          <td className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(p); setShowHistory(true); }}>
                              <History size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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

          {/* Movements Tab */}
          {activeTab === 'movements' && (
            <>
              {/* Movement Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <input 
                  type="text" 
                  value={movementProductFilter} 
                  onChange={e => setMovementProductFilter(e.target.value)}
                  placeholder="جستجوی کالا..." 
                  className="input flex-1 min-w-[200px]" 
                />
                <select 
                  value={movementTypeFilter} 
                  onChange={e => setMovementTypeFilter(e.target.value)}
                  className="input w-auto"
                >
                  <option value="all">همه انواع</option>
                  <option value="in">ورود</option>
                  <option value="out">خروج</option>
                  <option value="adjustment">اصلاح</option>
                  <option value="return">مرجوعی</option>
                  <option value="repair">تعمیر</option>
                </select>
                <input 
                  type="date" 
                  value={movementDateFrom} 
                  onChange={e => setMovementDateFrom(e.target.value)}
                  className="input w-auto" 
                />
                <input 
                  type="date" 
                  value={movementDateTo} 
                  onChange={e => setMovementDateTo(e.target.value)}
                  className="input w-auto" 
                />
                <Button variant="success" onClick={exportMovementsCSV}>
                  <Download size={18} />
                  اکسل
                </Button>
              </div>

              {/* Movements Table */}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>تاریخ</th>
                      <th>کالا</th>
                      <th>نوع</th>
                      <th className="text-center">مقدار</th>
                      <th className="text-center">قبل</th>
                      <th className="text-center">بعد</th>
                      {hasPermission('sales.view_profit') && (
                        <th className="text-left">قیمت</th>
                      )}
                      <th>مرجع</th>
                      <th>کاربر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.slice(0, 100).map(m => (
                      <tr key={m.id}>
                        <td className="text-xs">{toJalaliFull(m.date)}</td>
                        <td className="text-sm font-medium">{m.productName}</td>
                        <td>
                          <span className={`badge ${getMovementTypeColor(m.type)}`}>
                            {getMovementTypeLabel(m.type)}
                          </span>
                        </td>
                        <td className={`text-center text-sm font-bold ${
                          m.type === 'in' || m.type === 'return' ? 'text-green-600' : 
                          m.type === 'out' || m.type === 'repair' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {m.type === 'in' || m.type === 'return' ? '+' : m.type === 'out' || m.type === 'repair' ? '-' : ''}{m.quantity}
                        </td>
                        <td className="text-center text-xs text-slate-500">{m.previousStock}</td>
                        <td className="text-center text-xs text-slate-500">{m.newStock}</td>
                        {hasPermission('sales.view_profit') && (
                          <td className="text-left text-xs">{formatCurrency(m.unitPrice || 0, db.getSettings().currency)}</td>
                        )}
                        <td className="text-xs">{m.reference}</td>
                        <td className="text-xs">{m.userName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredMovements.length === 0 && (
                <div className="text-center py-12">
                  <History size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-slate-500 dark:text-slate-400">حرکتی ثبت نشده</p>
                </div>
              )}
              {filteredMovements.length > 100 && (
                <p className="text-center text-xs text-slate-400 py-2">
                  نمایش ۱۰۰ مورد اول از {filteredMovements.length}
                </p>
              )}
            </>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">گزارش‌های انبار</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3">کالاهای کم‌موجود</h4>
                  <div className="space-y-2">
                    {products.filter(p => getStockStatus(p) === 'low').slice(0, 10).map(p => (
                      <div key={p.id} className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <span className="text-sm">{p.name}</span>
                        <span className="text-sm font-bold text-amber-600">{p.stock} / {p.minStock}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3">کالاهای ناموجود</h4>
                  <div className="space-y-2">
                    {products.filter(p => getStockStatus(p) === 'out').slice(0, 10).map(p => (
                      <div key={p.id} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-sm">{p.name}</span>
                        <span className="text-sm font-bold text-red-600">0</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {hasPermission('sales.view_profit') && (
                <div className="card p-5">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3">ارزش موجودی بر اساس دسته‌بندی</h4>
                  <div className="space-y-2">
                    {categories.map(cat => {
                      const catProducts = products.filter(p => p.category === cat);
                      const catValue = catProducts.reduce((sum, p) => sum + ((p.averageBuyPrice || p.buyPrice) * p.stock), 0);
                      return (
                        <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <span className="text-sm font-medium">{cat}</span>
                          <span className="text-sm font-bold text-emerald-600">{formatCurrency(catValue, db.getSettings().currency)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product History Modal */}
      {showHistory && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                تاریخچه گردش - {selectedProduct.name}
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">موجودی فعلی</p>
                  <p className="text-xl font-bold text-blue-600">{selectedProduct.stock}</p>
                </div>
                {hasPermission('sales.view_profit') && (
                  <>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">میانگین خرید</p>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(selectedProduct.averageBuyPrice || selectedProduct.buyPrice, db.getSettings().currency)}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">ارزش موجودی</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency((selectedProduct.averageBuyPrice || selectedProduct.buyPrice) * selectedProduct.stock, db.getSettings().currency)}</p>
                    </div>
                  </>
                )}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">حداقل موجودی</p>
                  <p className="text-xl font-bold text-amber-600">{selectedProduct.minStock}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>تاریخ</th>
                      <th>نوع</th>
                      <th className="text-center">مقدار</th>
                      <th className="text-center">قبل</th>
                      <th className="text-center">بعد</th>
                      {hasPermission('sales.view_profit') && (
                        <th className="text-left">قیمت</th>
                      )}
                      <th>مرجع</th>
                      <th>کاربر</th>
                      <th>توضیحات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getProductMovementHistory(selectedProduct.id).map(m => (
                      <tr key={m.id}>
                        <td className="text-xs">{toJalaliFull(m.date)}</td>
                        <td>
                          <span className={`badge ${getMovementTypeColor(m.type)}`}>
                            {getMovementTypeLabel(m.type)}
                          </span>
                        </td>
                        <td className={`text-center text-sm font-bold ${
                          m.type === 'in' || m.type === 'return' ? 'text-green-600' : 
                          m.type === 'out' || m.type === 'repair' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {m.type === 'in' || m.type === 'return' ? '+' : m.type === 'out' || m.type === 'repair' ? '-' : ''}{m.quantity}
                        </td>
                        <td className="text-center text-xs">{m.previousStock}</td>
                        <td className="text-center text-xs">{m.newStock}</td>
                        {hasPermission('sales.view_profit') && (
                          <td className="text-left text-xs">{formatCurrency(m.unitPrice || 0, db.getSettings().currency)}</td>
                        )}
                        <td className="text-xs">{m.reference}</td>
                        <td className="text-xs">{m.userName}</td>
                        <td className="text-xs">{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stocktaking Modal */}
      {showStocktaking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-scaleIn">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">انبارگردانی</h3>
                  <p className="text-sm text-white/80">شمارش و تطبیق موجودی واقعی با سیستم</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowStocktaking(false); resetStocktaking(); }} 
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  مرحله {stocktakingStep === 'select' ? '۱' : stocktakingStep === 'count' ? '۲' : stocktakingStep === 'review' ? '۳' : '۴'} از ۴
                </span>                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {stocktakingStep === 'select' && 'انتخاب محدوده'}
                  {stocktakingStep === 'count' && 'شمارش موجودی'}
                  {stocktakingStep === 'review' && 'بررسی مغایرت‌ها'}
                  {stocktakingStep === 'complete' && 'تکمیل انبارگردانی'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: stocktakingStep === 'select' ? '25%' : stocktakingStep === 'count' ? '50%' : stocktakingStep === 'review' ? '75%' : '100%' }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Step 1: Select */}
              {stocktakingStep === 'select' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">انتخاب محدوده انبارگردانی</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <button
                        onClick={() => setStocktakingMode('full')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          stocktakingMode === 'full'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <Package size={32} className={`mx-auto mb-3 ${stocktakingMode === 'full' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <p className="font-bold text-center text-slate-900 dark:text-white">انبارگردانی کامل</p>
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">شمارش تمام کالاها</p>
                      </button>

                      <button
                        onClick={() => setStocktakingMode('category')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          stocktakingMode === 'category'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <Filter size={32} className={`mx-auto mb-3 ${stocktakingMode === 'category' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <p className="font-bold text-center text-slate-900 dark:text-white">بر اساس دسته‌بندی</p>
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">شمارش یک دسته خاص</p>
                      </button>

                      <button
                        onClick={() => setStocktakingMode('product')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          stocktakingMode === 'product'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <Search size={32} className={`mx-auto mb-3 ${stocktakingMode === 'product' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <p className="font-bold text-center text-slate-900 dark:text-white">کالای خاص</p>
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">شمارش کالاهای انتخابی</p>
                      </button>
                    </div>

                    {stocktakingMode === 'category' && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">انتخاب دسته‌بندی</label>
                        <select
                          value={stocktakingCategory}
                          onChange={e => setStocktakingCategory(e.target.value)}
                          className="input"
                        >
                          <option value="all">همه دسته‌ها</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}

                    {stocktakingMode === 'product' && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">جستجوی کالا</label>
                        <input
                          type="text"
                          placeholder="نام کالا را جستجو کنید..."
                          className="input"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-bold mb-1">راهنمای انبارگردانی</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>موجودی واقعی کالاها را شمارش کنید</li>
                          <li>مغایرت‌ها را با دلیل ثبت کنید</li>
                          <li>پس از تأیید، موجودی سیستم به‌روزرسانی می‌شود</li>
                          <li>تمام تغییرات در تاریخچه انبار ثبت خواهند شد</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Count */}
              {stocktakingStep === 'count' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">شمارش موجودی</h4>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {stocktakingProducts.filter(p => p.checked).length} از {stocktakingProducts.length} کالا شمارش شده
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>کالا</th>
                          <th className="text-center">موجودی سیستم</th>
                          <th className="text-center">موجودی واقعی</th>
                          <th className="text-center">مغایرت</th>
                          <th>دلیل مغایرت</th>
                          <th className="text-center">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocktakingProducts.map(item => (
                          <tr key={item.productId} className={item.difference !== 0 ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                            <td className="font-medium">{item.productName}</td>
                            <td className="text-center font-bold text-blue-600">{item.systemStock}</td>
                            <td className="text-center">
                              <input
                                type="number"
                                value={item.actualStock}
                                onChange={e => updateStocktakingProduct(
                                  item.productId,
                                  Number(e.target.value),
                                  item.reason
                                )}
                                className="input w-20 text-center"
                                min="0"
                              />
                            </td>
                            <td className={`text-center font-bold ${
                              item.difference === 0 ? 'text-green-600' :
                              item.difference > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.reason}
                                onChange={e => updateStocktakingProduct(
                                  item.productId,
                                  item.actualStock,
                                  e.target.value
                                )}
                                className="input"
                                placeholder="دلیل مغایرت..."
                                disabled={item.difference === 0}
                              />
                            </td>
                            <td className="text-center">
                              {item.checked ? (
                                <span className="badge badge-success">✓ شمارش شده</span>
                              ) : (
                                <span className="badge badge-warning">در انتظار</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {stocktakingStep === 'review' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">بررسی مغایرت‌ها</h4>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="card p-4 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">کل کالاها</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{getStocktakingSummary().total}</p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">شمارش شده</p>
                      <p className="text-2xl font-bold text-blue-600">{getStocktakingSummary().checked}</p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مغایرت</p>
                      <p className="text-2xl font-bold text-amber-600">{getStocktakingSummary().discrepancies}</p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">افزایش</p>
                      <p className="text-2xl font-bold text-green-600">+{getStocktakingSummary().positive}</p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">کاهش</p>
                      <p className="text-2xl font-bold text-red-600">-{getStocktakingSummary().negative}</p>
                    </div>
                  </div>

                  {/* Discrepancies List */}
                  {stocktakingProducts.filter(p => p.difference !== 0).length > 0 && (
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white mb-3">لیست مغایرت‌ها</h5>
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>کالا</th>
                              <th className="text-center">سیستم</th>
                              <th className="text-center">واقعی</th>
                              <th className="text-center">مغایرت</th>
                              <th>دلیل</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stocktakingProducts.filter(p => p.difference !== 0).map(item => (
                              <tr key={item.productId} className={item.difference > 0 ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}>
                                <td className="font-medium">{item.productName}</td>
                                <td className="text-center">{item.systemStock}</td>
                                <td className="text-center">{item.actualStock}</td>
                                <td className={`text-center font-bold ${item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.difference > 0 ? '+' : ''}{item.difference}
                                </td>
                                <td className="text-sm">{item.reason || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {stocktakingProducts.filter(p => p.difference !== 0).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} className="text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-green-600 mb-2">تبریک!</p>
                      <p className="text-slate-600 dark:text-slate-400">هیچ مغایرتی یافت نشد. موجودی سیستم با موجودی واقعی مطابقت دارد.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Complete */}
              {stocktakingStep === 'complete' && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle size={48} className="text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">انبارگردانی با موفقیت انجام شد!</h4>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {stocktakingProducts.filter(p => p.difference !== 0).length} مغایرت اصلاح شد
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="card p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">کل کالاها</p>
                      <p className="text-2xl font-bold text-blue-600">{getStocktakingSummary().total}</p>
                    </div>
                    <div className="card p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مغایرت‌ها</p>
                      <p className="text-2xl font-bold text-amber-600">{getStocktakingSummary().discrepancies}</p>
                    </div>
                    <div className="card p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">اصلاح شده</p>
                      <p className="text-2xl font-bold text-green-600">{getStocktakingSummary().discrepancies}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                {stocktakingStep !== 'select' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setStocktakingStep(
                      stocktakingStep === 'count' ? 'select' : 
                      stocktakingStep === 'review' ? 'count' : 'review'
                    )}
                  >
                    مرحله قبل
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { setShowStocktaking(false); resetStocktaking(); }}
                >
                  انصراف
                </Button>
                
                {stocktakingStep === 'select' && (
                  <Button variant="primary" onClick={startStocktaking}>
                    شروع انبارگردانی
                  </Button>
                )}
                
                {stocktakingStep === 'count' && (
                  <Button 
                    variant="primary" 
                    onClick={() => setStocktakingStep('review')}
                    disabled={stocktakingProducts.filter(p => p.checked).length === 0}
                  >
                    بررسی مغایرت‌ها
                  </Button>
                )}
                
                {stocktakingStep === 'review' && (
                  <Button 
                    variant="success" 
                    onClick={() => {
                      applyStocktakingResults();
                      setStocktakingStep('complete');
                    }}
                  >
                    <CheckCircle size={18} />
                    تأیید و اعمال اصلاحات
                  </Button>
                )}
                
                {stocktakingStep === 'complete' && (
                  <Button 
                    variant="primary" 
                    onClick={() => { setShowStocktaking(false); resetStocktaking(); }}
                  >
                    پایان
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
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
                value={adjustForm.productId} 
                onChange={e => {
                  const product = products.find(p => p.id === e.target.value);
                  setAdjustForm({ ...adjustForm, productId: e.target.value, newStock: product?.stock || 0 });
                }}
                className="input"
              >
                <option value="">انتخاب کالا</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stock})</option>)}
              </select>
            </div>
            {adjustForm.productId && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">موجودی فعلی</p>
                <p className="text-lg font-bold text-blue-600">
                  {products.find(p => p.id === adjustForm.productId)?.stock || 0}
                </p>
              </div>
            )}
            <Input
              label="موجودی جدید"
              type="number"
              value={adjustForm.newStock}
              onChange={e => setAdjustForm({ ...adjustForm, newStock: Number(e.target.value) })}
              min="0"
            />
            {adjustForm.productId && (
              <div className={`p-3 rounded-lg ${
                adjustForm.newStock > (products.find(p => p.id === adjustForm.productId)?.stock || 0)
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : adjustForm.newStock < (products.find(p => p.id === adjustForm.productId)?.stock || 0)
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-slate-50 dark:bg-slate-700/50'
              }`}>
                <p className="text-xs text-slate-500 dark:text-slate-400">تغییر</p>
                <p className={`text-lg font-bold ${
                  adjustForm.newStock > (products.find(p => p.id === adjustForm.productId)?.stock || 0)
                    ? 'text-green-600'
                    : adjustForm.newStock < (products.find(p => p.id === adjustForm.productId)?.stock || 0)
                    ? 'text-red-600'
                    : 'text-slate-600'
                }`}>
                  {adjustForm.newStock - (products.find(p => p.id === adjustForm.productId)?.stock || 0) > 0 ? '+' : ''}
                  {adjustForm.newStock - (products.find(p => p.id === adjustForm.productId)?.stock || 0)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">دلیل اصلاح *</label>
              <textarea
                value={adjustForm.reason}
                onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                className="input"
                rows={3}
                placeholder="مثال: کسری موجودی در شمارش انبار"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdjust(false)}>
                انصراف
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleAdjustStock}>
                ثبت اصلاح
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

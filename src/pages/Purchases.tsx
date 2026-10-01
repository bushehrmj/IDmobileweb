import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Purchase, type PurchaseItem } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, Search, X, Truck, Package, DollarSign, Eye
} from 'lucide-react';

export default function Purchases() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [form, setForm] = useState({
    supplierName: '', date: new Date().toISOString().split('T')[0],
    dollarRate: 0, paid: 0, notes: '',
  });

  useEffect(() => { loadPurchases(); }, []);
  const loadPurchases = () => setPurchases(db.getPurchases().reverse());

  const filtered = purchases.filter(p =>
    p.invoiceNumber.includes(search) || p.supplierName.includes(search)
  );

  const addItem = () => {
    setItems([...items, { id: uuidv4(), productId: '', productName: '', quantity: 1, buyPrice: 0, total: 0, imeis: [] }]);
  };

  const updateItem = (idx: number, field: string, value: unknown) => {
    const newItems = [...items];
    (newItems[idx] as unknown as Record<string, unknown>)[field] = value;
    if (field === 'quantity' || field === 'buyPrice') {
      newItems[idx].total = newItems[idx].quantity * newItems[idx].buyPrice;
    }
    setItems(newItems);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  const save = () => {
    if (!form.supplierName.trim()) { showToast('error', 'نام تأمین‌کننده الزامی است'); return; }
    if (items.length === 0) { showToast('error', 'حداقل یک کالا اضافه کنید'); return; }

    const purchase: Purchase = {
      id: uuidv4(),
      invoiceNumber: String(Date.now()).slice(-6),
      date: form.date,
      supplierId: '',
      supplierName: form.supplierName,
      items,
      subtotal,
      total: subtotal,
      paid: Number(form.paid) || 0,
      remaining: subtotal - (Number(form.paid) || 0),
      dollarRate: Number(form.dollarRate) || 0,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };

    db.savePurchase(purchase);

    items.forEach(item => {
      if (item.productId) {
        const product = db.getProduct(item.productId);
        if (product) {
          product.stock += item.quantity;
          product.buyPrice = item.buyPrice;
          product.dollarRateAtPurchase = Number(form.dollarRate) || 0;
          product.updatedAt = new Date().toISOString();
          db.saveProduct(product);
        }
      }

      item.imeis.forEach(imei => {
        if (imei.trim()) {
          const serial = {
            id: uuidv4(), productId: item.productId, imei1: imei.trim(),
            imei2: '', serial: '', status: 'available' as const, purchaseId: purchase.id,
            createdAt: new Date().toISOString(),
          };
          db.saveSerial(serial);
        }
      });

      db.saveStockMovement({
        id: uuidv4(), productId: item.productId, productName: item.productName,
        type: 'in', quantity: item.quantity, reference: purchase.invoiceNumber,
        referenceType: 'purchase', referenceId: purchase.id,
        userId: user?.id || '', userName: user?.fullName || '',
        date: new Date().toISOString(), notes: '',
      });
    });

    db.addAuditLog({
      id: uuidv4(), userId: user?.id || '', userName: user?.fullName || '',
      action: 'create_purchase', entity: 'purchase', entityId: purchase.id,
      newValue: `خرید از ${purchase.supplierName} - ${formatCurrency(purchase.total, settings.currency)}`,
      ip: '127.0.0.1', date: new Date().toISOString(),
    });

    showToast('success', 'خرید ثبت شد');
    setShowForm(false);
    setItems([]);
    setForm({ supplierName: '', date: new Date().toISOString().split('T')[0], dollarRate: 0, paid: 0, notes: '' });
    loadPurchases();
  };

  const addManualProduct = () => {
    const name = prompt('نام کالا:');
    if (!name) return;
    const priceStr = prompt('قیمت خرید:', '0');
    const price = parseInt(priceStr || '0') || 0;
    const qtyStr = prompt('تعداد:', '1');
    const qty = parseInt(qtyStr || '1') || 1;
    
    let product = db.getProducts().find(p => p.name === name);
    if (!product) {
      product = {
        id: uuidv4(), name, brand: '', model: '', category: 'موبایل',
        sku: '', barcode: '', imeiRequired: false, serialRequired: false,
        color: '', storage: '', description: '', buyPrice: price,
        sellPrice: Math.round(price * 1.15), minStock: 1, stock: 0,
        status: 'active' as const, dollarRateAtPurchase: Number(form.dollarRate) || 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      db.saveProduct(product);
      showToast('info', `کالای "${name}" ایجاد شد`);
    }
    
    setItems([...items, {
      id: uuidv4(), productId: product.id, productName: product.name,
      quantity: qty, buyPrice: price, total: qty * price, imeis: [],
    }]);
  };

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paid, 0);
  const totalRemaining = purchases.reduce((sum, p) => sum + p.remaining, 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">خرید</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت خرید از تأمین‌کنندگان</p>
        </div>
        {hasPermission('purchases.create') && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            خرید جدید
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">جمع خرید</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totalPurchases, settings.currency)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">پرداخت شده</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid, settings.currency)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">بدهی به تأمین‌کنندگان</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalRemaining, settings.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-5">
        <div className="relative">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو شماره فاکتور یا تأمین‌کننده..." 
            className="input pr-12" 
          />
        </div>
      </div>

      {/* Purchases List */}
      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-lg text-slate-900 dark:text-white">
                  خرید #{p.invoiceNumber}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {p.supplierName} | {toJalali(p.date)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {p.items.length} کالا 
                  {p.dollarRate > 0 && ` | دلار: ${formatCurrency(p.dollarRate, '')}`}
                </p>
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(p.total, settings.currency)}
                </p>
                {p.remaining > 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    بدهی: {formatCurrency(p.remaining, settings.currency)}
                  </p>
                )}
                <Button variant="ghost" size="sm" onClick={() => setViewPurchase(p)} className="mt-2">
                  <Eye size={14} />
                  مشاهده
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Truck size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">خریدی یافت نشد</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {search ? 'جستجوی خود را تغییر دهید' : 'اولین خرید خود را ثبت کنید'}
            </p>
          </div>
        )}
      </div>

      {/* View Purchase Modal */}
      {viewPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                خرید #{viewPurchase.invoiceNumber}
              </h3>
              <button onClick={() => setViewPurchase(null)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">تأمین‌کننده</p>
                  <p className="font-medium">{viewPurchase.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">تاریخ</p>
                  <p className="font-medium">{toJalali(viewPurchase.date)}</p>
                </div>
                {viewPurchase.dollarRate > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">نرخ دلار</p>
                    <p className="font-medium">{formatCurrency(viewPurchase.dollarRate, settings.currency)}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">کالاها</p>
                <div className="space-y-2">
                  {viewPurchase.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × {formatCurrency(item.buyPrice, settings.currency)}
                        </p>
                      </div>
                      <p className="text-sm font-bold">{formatCurrency(item.total, settings.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جمع کل</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(viewPurchase.total, settings.currency)}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">پرداخت شده</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(viewPurchase.paid, settings.currency)}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مانده</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(viewPurchase.remaining, settings.currency)}</p>
                </div>
              </div>

              {viewPurchase.notes && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">یادداشت</p>
                  <p className="text-sm">{viewPurchase.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">خرید جدید</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="تأمین‌کننده *"
                  value={form.supplierName}
                  onChange={e => setForm({ ...form, supplierName: e.target.value })}
                />
                <Input
                  label="تاریخ"
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
                <Input
                  label="نرخ دلار"
                  type="number"
                  value={form.dollarRate}
                  onChange={e => setForm({ ...form, dollarRate: Number(e.target.value) })}
                />
                <Input
                  label="مبلغ پرداختی"
                  type="number"
                  value={form.paid}
                  onChange={e => setForm({ ...form, paid: Number(e.target.value) })}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-900 dark:text-white">کالاها</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addItem}>
                      <Plus size={14} />
                      از لیست
                    </Button>
                    <Button variant="success" size="sm" onClick={addManualProduct}>
                      <Plus size={14} />
                      ثبت دستی
                    </Button>
                  </div>
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-2 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <select 
                        value={item.productId} 
                        onChange={e => {
                          const p = db.getProduct(e.target.value);
                          updateItem(idx, 'productId', e.target.value);
                          if (p) { updateItem(idx, 'productName', p.name); updateItem(idx, 'buyPrice', p.buyPrice); }
                        }}
                        className="input col-span-2"
                      >
                        <option value="">انتخاب کالا</option>
                        {db.getProducts().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <Button variant="danger" size="sm" onClick={() => removeItem(idx)}>
                        <X size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="number" 
                        placeholder="تعداد" 
                        value={item.quantity} 
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="input" 
                      />
                      <input 
                        type="number" 
                        placeholder="قیمت خرید" 
                        value={item.buyPrice} 
                        onChange={e => updateItem(idx, 'buyPrice', Number(e.target.value))}
                        className="input" 
                      />
                      <span className="flex items-center justify-center text-sm font-bold">
                        {formatCurrency(item.total, settings.currency)}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="IMEI (با کاما جدا کنید)" 
                      value={item.imeis.join(',')}
                      onChange={e => updateItem(idx, 'imeis', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="input" 
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <span className="font-bold">جمع کل:</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(subtotal, settings.currency)}</span>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">یادداشت</label>
                <textarea 
                  value={form.notes} 
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="input" 
                  rows={2} 
                />
              </div>

              <Button variant="primary" size="lg" className="w-full" onClick={save}>
                ثبت خرید
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

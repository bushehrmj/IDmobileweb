import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Purchase, type PurchaseItem, type ProductSerial } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, X, Truck } from 'lucide-react';

export default function Purchases() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<PurchaseItem[]>([]);
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

    // Update products stock
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

      // Save IMEIs
      item.imeis.forEach(imei => {
        if (imei.trim()) {
          const serial: ProductSerial = {
            id: uuidv4(), productId: item.productId, imei1: imei.trim(),
            imei2: '', serial: '', status: 'available', purchaseId: purchase.id,
            createdAt: new Date().toISOString(),
          };
          db.saveSerial(serial);
        }
      });

      // Stock movement
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

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">خرید</h2>
        {hasPermission('purchases.create') && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus size={16} /> خرید جدید
          </button>
        )}
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="جستجو..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">خرید #{p.invoiceNumber}</p>
                <p className="text-xs text-slate-500 mt-1">{p.supplierName} | {toJalali(p.date)}</p>
                <p className="text-xs text-slate-500">{p.items.length} کالا {p.dollarRate > 0 && `| دلار: ${formatCurrency(p.dollarRate, '')}`}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{formatCurrency(p.total, settings.currency)}</p>
                {p.remaining > 0 && <p className="text-xs text-red-500">بدهی: {formatCurrency(p.remaining, settings.currency)}</p>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">خریدی یافت نشد</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="font-bold">خرید جدید</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">تأمین‌کننده *</label>
                  <input type="text" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">تاریخ</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">نرخ دلار</label>
                  <input type="number" value={form.dollarRate} onChange={e => setForm({ ...form, dollarRate: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">مبلغ پرداختی</label>
                  <input type="number" value={form.paid} onChange={e => setForm({ ...form, paid: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold">کالاها</label>
                  <button onClick={addItem} className="text-xs text-blue-600">+ افزودن</button>
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-2 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <select value={item.productId} onChange={e => {
                        const p = db.getProduct(e.target.value);
                        updateItem(idx, 'productId', e.target.value);
                        if (p) { updateItem(idx, 'productName', p.name); updateItem(idx, 'buyPrice', p.buyPrice); }
                      }}
                        className="col-span-2 px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700">
                        <option value="">انتخاب کالا</option>
                        {db.getProducts().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={() => removeItem(idx)} className="text-red-500 text-xs"><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="تعداد" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700" />
                      <input type="number" placeholder="قیمت خرید" value={item.buyPrice} onChange={e => updateItem(idx, 'buyPrice', Number(e.target.value))}
                        className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700" />
                      <span className="text-xs flex items-center justify-center">{formatCurrency(item.total, settings.currency)}</span>
                    </div>
                    <input type="text" placeholder="IMEI (با کاما جدا کنید)" value={item.imeis.join(',')}
                      onChange={e => updateItem(idx, 'imeis', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700" />
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                <span>جمع کل:</span>
                <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
              </div>

              <div>
                <label className="text-xs text-slate-500">یادداشت</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
              </div>

              <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">ثبت خرید</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

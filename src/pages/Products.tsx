import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { db, type Product, type ProductSerial } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Edit, Trash2, X, Package, Barcode, TrendingUp, TrendingDown, History } from 'lucide-react';

export default function Products() {
  const { hasPermission, user } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showIMEI, setShowIMEI] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Product>>({
    name: '', brand: '', model: '', category: 'موبایل', sku: '', barcode: '',
    imeiRequired: true, serialRequired: false, color: '', storage: '',
    description: '', buyPrice: 0, sellPrice: 0, minStock: 1, stock: 0, status: 'active',
  });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = () => setProducts(db.getProducts().reverse());

  const filtered = products.filter(p =>
    p.name.includes(search) || p.brand.includes(search) || p.model?.includes(search) || p.barcode?.includes(search)
  );

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: '', brand: '', model: '', category: 'موبایل', sku: '', barcode: '', imeiRequired: true, serialRequired: false, color: '', storage: '', description: '', buyPrice: 0, sellPrice: 0, minStock: 1, stock: 0, status: 'active' });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ ...p });
    setShowForm(true);
  };

  const saveProduct = () => {
    if (!form.name?.trim()) { showToast('error', 'نام کالا الزامی است'); return; }
    if (!form.sellPrice || form.sellPrice <= 0) { showToast('error', 'قیمت فروش الزامی است'); return; }

    const now = new Date().toISOString();
    const product: Product = {
      id: editProduct?.id || uuidv4(),
      name: form.name || '', brand: form.brand || '', model: form.model || '',
      category: form.category || '', sku: form.sku || '', barcode: form.barcode || '',
      imeiRequired: form.imeiRequired || false, serialRequired: form.serialRequired || false,
      color: form.color || '', storage: form.storage || '', description: form.description || '',
      buyPrice: form.buyPrice || 0, sellPrice: form.sellPrice || 0,
      minStock: form.minStock || 0, stock: editProduct?.stock ?? form.stock ?? 0,
      status: (form.status as 'active' | 'inactive') || 'active',
      createdAt: editProduct?.createdAt || now, updatedAt: now,
    };

    if (editProduct) {
      // Audit log for price change
      if (editProduct.buyPrice !== product.buyPrice || editProduct.sellPrice !== product.sellPrice) {
        db.addAuditLog({
          id: uuidv4(), userId: user?.id || '', userName: user?.fullName || '',
          action: 'edit_product_price', entity: 'product', entityId: product.id,
          oldValue: `خرید: ${editProduct.buyPrice} | فروش: ${editProduct.sellPrice}`,
          newValue: `خرید: ${product.buyPrice} | فروش: ${product.sellPrice}`,
          ip: '127.0.0.1', date: now,
        });
      }
    }

    db.saveProduct(product);
    showToast('success', editProduct ? 'کالا ویرایش شد' : 'کالا اضافه شد');
    setShowForm(false);
    loadProducts();
  };

  const deleteProduct = (id: string) => {
    if (!confirm('آیا از حذف این کالا مطمئن هستید؟')) return;
    db.deleteProduct(id);
    showToast('success', 'کالا حذف شد');
    loadProducts();
  };

  const addIMEI = (productId: string) => {
    const imei = prompt('IMEI را وارد کنید:');
    if (!imei?.trim()) return;
    const existing = db.getSerialByIMEI(imei.trim());
    if (existing) { showToast('error', 'این IMEI قبلاً ثبت شده'); return; }
    const serial: ProductSerial = {
      id: uuidv4(), productId, imei1: imei.trim(), imei2: '', serial: '',
      status: 'available', createdAt: new Date().toISOString(),
    };
    db.saveSerial(serial);
    // Increase stock
    const product = db.getProduct(productId);
    if (product) { product.stock += 1; db.saveProduct(product); }
    showToast('success', 'IMEI ثبت شد');
    loadProducts();
  };

  const suggestedPrice = () => {
    const buyPrice = Number(form.buyPrice) || 0;
    const profit = settings.defaultProfitPercent || 15;
    const suggested = Math.round(buyPrice * (1 + profit / 100));
    setForm({ ...form, sellPrice: suggested });
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">محصولات</h2>
        {hasPermission('products.create') && (
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus size={16} /> کالای جدید
          </button>
        )}
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="جستجو نام، برند، بارکد..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{p.name}</p>
                  {p.stock <= p.minStock && p.minStock > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-1.5 py-0.5 rounded">موجودی کم</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{p.brand} {p.model} {p.color && `| ${p.color}`} {p.storage && `| ${p.storage}`}</p>
                {p.barcode && <p className="text-xs text-slate-400 mt-0.5">بارکد: {p.barcode}</p>}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-sm font-bold text-blue-600">{formatCurrency(p.sellPrice, settings.currency)}</span>
                  {hasPermission('sales.view_profit') && (
                    <>
                      <span className="text-xs text-slate-500">خرید: {formatCurrency(p.buyPrice, settings.currency)}</span>
                      {p.sellPrice > p.buyPrice && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp size={10} />
                          سود: {formatCurrency(p.sellPrice - p.buyPrice, settings.currency)}
                        </span>
                      )}
                    </>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    p.stock <= p.minStock ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    موجودی: {p.stock}
                  </span>
                  {p.dollarRateAtPurchase && p.dollarRateAtPurchase > 0 && (
                    <span className="text-xs text-slate-400">دلار: {formatCurrency(p.dollarRateAtPurchase, '')}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {p.imeiRequired && (
                  <button onClick={() => setShowIMEI(showIMEI === p.id ? null : p.id)} className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded" title="IMEI">
                    <Barcode size={14} />
                  </button>
                )}
                {hasPermission('products.edit') && (
                  <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={14} /></button>
                )}
                {hasPermission('products.delete') && (
                  <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
            {showIMEI === p.id && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold">IMEI های ثبت شده</p>
                  <button onClick={() => addIMEI(p.id)} className="text-xs text-blue-600">+ افزودن IMEI</button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {db.getSerialsByProduct(p.id).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <span>{s.imei1}</span>
                      <span className={`px-1.5 py-0.5 rounded ${s.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                        {s.status === 'available' ? 'موجود' : s.status === 'sold' ? 'فروخته' : s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">کالایی یافت نشد</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="font-bold">{editProduct ? 'ویرایش کالا' : 'کالای جدید'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500">نام کالا *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">برند</label>
                  <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">مدل</label>
                  <input type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">دسته‌بندی</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                    <option value="موبایل">موبایل</option>
                    <option value="تبلت">تبلت</option>
                    <option value="لوازم جانبی">لوازم جانبی</option>
                    <option value="گلس و محافظ">گلس و محافظ</option>
                    <option value="قطعات">قطعات</option>
                    <option value="ساعت هوشمند">ساعت هوشمند</option>
                    <option value="هدفون">هدفون</option>
                    <option value="شارژر">شارژر</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">بارکد</label>
                  <input type="text" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">رنگ</label>
                  <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">حافظه</label>
                  <input type="text" value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">قیمت خرید {hasPermission('sales.view_profit') ? '' : '(مخفی)'}</label>
                  <input type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">قیمت فروش *</label>
                  <div className="flex gap-1 mt-1">
                    <input type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                    <button onClick={suggestedPrice} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs" title="قیمت پیشنهادی">💡</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">حداقل موجودی</label>
                  <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">موجودی اولیه</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                    disabled={!!editProduct}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 disabled:opacity-50" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.imeiRequired} onChange={e => setForm({ ...form, imeiRequired: e.target.checked })} className="rounded" />
                  نیاز به IMEI
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.serialRequired} onChange={e => setForm({ ...form, serialRequired: e.target.checked })} className="rounded" />
                  نیاز به سریال
                </label>
              </div>
              <div>
                <label className="text-xs text-slate-500">توضیحات</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
              </div>
              <button onClick={saveProduct} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                {editProduct ? 'ذخیره تغییرات' : 'افزودن کالا'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

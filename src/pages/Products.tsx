import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { db, type Product, type ProductSerial } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, Search, Edit, Trash2, X, Package, Barcode, 
  AlertTriangle, Filter, SortAsc, SortDesc, Eye
} from 'lucide-react';

export default function Products() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showIMEI, setShowIMEI] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<Partial<Product>>({
    name: '', brand: '', model: '', category: 'موبایل', sku: '', barcode: '',
    imeiRequired: true, serialRequired: false, color: '', storage: '',
    description: '', buyPrice: 0, sellPrice: 0, minStock: 1, stock: 0, status: 'active',
  });

  useEffect(() => { 
    loadProducts(); 
  }, []);

  const loadProducts = () => setProducts(db.getProducts().reverse());

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.includes(search) || p.brand.includes(search) || 
                         p.model?.includes(search) || p.barcode?.includes(search);
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && p.stock <= p.minStock && p.minStock > 0) ||
                        (stockFilter === 'out' && p.stock === 0) ||
                        (stockFilter === 'ok' && p.stock > p.minStock);
      return matchSearch && matchCategory && matchStock;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'stock') comparison = a.stock - b.stock;
      else if (sortBy === 'price') comparison = a.sellPrice - b.sellPrice;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const openNew = () => {
    setEditProduct(null);
    setForm({ 
      name: '', brand: '', model: '', category: 'موبایل', sku: '', barcode: '', 
      imeiRequired: true, serialRequired: false, color: '', storage: '', 
      description: '', buyPrice: 0, sellPrice: 0, minStock: 1, stock: 0, status: 'active' 
    });
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
      if (editProduct.buyPrice !== product.buyPrice || editProduct.sellPrice !== product.sellPrice) {
        db.addAuditLog({
          id: uuidv4(), userId: '', userName: '',
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

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.minStock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = hasPermission('sales.view_profit') 
    ? products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0) 
    : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">محصولات</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت کالاها و موجودی</p>
        </div>
        {hasPermission('products.create') && (
          <Button variant="primary" onClick={openNew}>
            <Plus size={18} />
            کالای جدید
          </Button>
        )}
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
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
            </div>
          </div>
        </div>
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
        {hasPermission('sales.view_profit') && (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">ارزش انبار</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalValue, settings.currency)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">فیلتر و جستجو</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
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
            className="input"
          >
            <option value="all">همه دسته‌ها</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={stockFilter} 
            onChange={e => setStockFilter(e.target.value)}
            className="input"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="ok">موجودی کافی</option>
            <option value="low">موجودی کم</option>
            <option value="out">ناموجود</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-bold text-lg text-slate-900 dark:text-white">{p.name}</p>
                  {p.stock <= p.minStock && p.minStock > 0 && (
                    <span className="badge badge-warning">موجودی کم</span>
                  )}
                  {p.stock === 0 && (
                    <span className="badge badge-error">ناموجود</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {p.brand} {p.model} {p.color && `| ${p.color}`} {p.storage && `| ${p.storage}`}
                </p>
                {p.barcode && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    بارکد: {p.barcode}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(p.sellPrice, settings.currency)}
                  </span>
                  {hasPermission('sales.view_profit') && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      خرید: {formatCurrency(p.buyPrice, settings.currency)}
                    </span>
                  )}
                  <span className="badge badge-info">
                    موجودی: {p.stock}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.imeiRequired && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowIMEI(showIMEI === p.id ? null : p.id)}
                  >
                    <Barcode size={16} />
                    IMEI
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setViewProduct(p)}>
                  <Eye size={16} />
                </Button>
                {hasPermission('products.edit') && (
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    <Edit size={16} className="text-blue-500" />
                  </Button>
                )}
                {hasPermission('products.delete') && (
                  <Button variant="ghost" size="sm" onClick={() => deleteProduct(p.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                )}
              </div>
            </div>
            
            {showIMEI === p.id && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">IMEI های ثبت شده</p>
                  <Button variant="outline" size="sm" onClick={() => addIMEI(p.id)}>
                    <Plus size={14} />
                    افزودن IMEI
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {db.getSerialsByProduct(p.id).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <span className="text-sm font-mono">{s.imei1}</span>
                      <span className={`badge ${
                        s.status === 'available' ? 'badge-success' : 
                        s.status === 'sold' ? 'badge-error' : 'badge-warning'
                      }`}>
                        {s.status === 'available' ? 'موجود' : s.status === 'sold' ? 'فروخته' : s.status}
                      </span>
                    </div>
                  ))}
                  {db.getSerialsByProduct(p.id).length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">IMEI ثبت نشده</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Package size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">کالایی یافت نشد</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {search || categoryFilter !== 'all' || stockFilter !== 'all' 
                ? 'فیلترهای خود را تغییر دهید' 
                : 'اولین کالای خود را اضافه کنید'}
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editProduct ? 'ویرایش کالا' : 'کالای جدید'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="نام کالا *"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="مثال: iPhone 13 Pro"
                  />
                </div>
                <Input
                  label="برند"
                  value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })}
                  placeholder="Apple"
                />
                <Input
                  label="مدل"
                  value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })}
                  placeholder="Pro Max"
                />
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">دسته‌بندی</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="input"
                  >
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
                <Input
                  label="بارکد"
                  value={form.barcode}
                  onChange={e => setForm({ ...form, barcode: e.target.value })}
                />
                <Input
                  label="رنگ"
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                />
                <Input
                  label="حافظه"
                  value={form.storage}
                  onChange={e => setForm({ ...form, storage: e.target.value })}
                  placeholder="256GB"
                />
                <div>
                  <Input
                    label={`قیمت خرید ${hasPermission('sales.view_profit') ? '' : '(مخفی)'}`}
                    type="number"
                    value={form.buyPrice}
                    onChange={e => setForm({ ...form, buyPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">قیمت فروش *</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={form.sellPrice} 
                      onChange={e => setForm({ ...form, sellPrice: Number(e.target.value) })}
                      className="input flex-1" 
                    />
                    <Button variant="outline" size="sm" onClick={suggestedPrice} title="قیمت پیشنهادی">
                      💡
                    </Button>
                  </div>
                </div>
                <Input
                  label="حداقل موجودی"
                  type="number"
                  value={form.minStock}
                  onChange={e => setForm({ ...form, minStock: Number(e.target.value) })}
                />
                <Input
                  label="موجودی اولیه"
                  type="number"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                  disabled={!!editProduct}
                />
              </div>
              
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.imeiRequired} 
                    onChange={e => setForm({ ...form, imeiRequired: e.target.checked })} 
                    className="w-5 h-5 rounded" 
                  />
                  <span className="text-sm font-medium">نیاز به IMEI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.serialRequired} 
                    onChange={e => setForm({ ...form, serialRequired: e.target.checked })} 
                    className="w-5 h-5 rounded" 
                  />
                  <span className="text-sm font-medium">نیاز به سریال</span>
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">توضیحات</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input" 
                  rows={3} 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={saveProduct}>
                  {editProduct ? 'ذخیره تغییرات' : 'افزودن کالا'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewProduct.name}</h3>
              <button onClick={() => setViewProduct(null)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">برند</p>
                  <p className="font-medium">{viewProduct.brand || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">مدل</p>
                  <p className="font-medium">{viewProduct.model || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">دسته‌بندی</p>
                  <p className="font-medium">{viewProduct.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">رنگ</p>
                  <p className="font-medium">{viewProduct.color || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">حافظه</p>
                  <p className="font-medium">{viewProduct.storage || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">بارکد</p>
                  <p className="font-mono text-sm">{viewProduct.barcode || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">قیمت فروش</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(viewProduct.sellPrice, settings.currency)}</p>
                </div>
                {hasPermission('sales.view_profit') && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">قیمت خرید</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(viewProduct.buyPrice, settings.currency)}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">موجودی</p>
                    <p className="text-2xl font-bold">{viewProduct.stock}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">حداقل موجودی</p>
                    <p className="text-xl font-bold">{viewProduct.minStock}</p>
                  </div>
                </div>
              </div>

              {viewProduct.description && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">توضیحات</p>
                  <p className="text-sm">{viewProduct.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

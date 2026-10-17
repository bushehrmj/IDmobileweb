import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Customer } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, Search, Edit, Trash2, X, Users, Phone, 
  Mail, MapPin, FileText, DollarSign, Eye
} from 'lucide-react';

export default function Customers() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [debtFilter, setDebtFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({ 
    firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: '' 
  });

  useEffect(() => { 
    loadCustomers(); 
  }, []);

  const loadCustomers = () => setCustomers(db.getCustomers().reverse());

  const filtered = customers.filter(c => {
    const matchSearch = c.firstName.includes(search) || c.lastName.includes(search) || 
                       c.mobile?.includes(search) || c.nationalId?.includes(search);
    const matchDebt = debtFilter === 'all' || 
                     (debtFilter === 'debt' && c.debt > 0) ||
                     (debtFilter === 'clear' && c.debt === 0);
    return matchSearch && matchDebt;
  });

  const openNew = () => { 
    setEditCustomer(null); 
    setForm({ firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: '' }); 
    setShowForm(true); 
  };

  const openEdit = (c: Customer) => { 
    setEditCustomer(c); 
    setForm({ ...c }); 
    setShowForm(true); 
  };

  const save = () => {
    if (!form.firstName?.trim() && !form.lastName?.trim()) { 
      showToast('error', 'نام الزامی است'); 
      return; 
    }
    
    const customer: Customer = {
      id: editCustomer?.id || uuidv4(),
      firstName: form.firstName || '', 
      lastName: form.lastName || '',
      mobile: form.mobile || '', 
      nationalId: form.nationalId || '',
      address: form.address || '', 
      notes: form.notes || '',
      totalPurchase: editCustomer?.totalPurchase || 0,
      totalPaid: editCustomer?.totalPaid || 0,
      debt: editCustomer?.debt || 0,
      invoiceCount: editCustomer?.invoiceCount || 0,
      lastPurchase: editCustomer?.lastPurchase,
      createdAt: editCustomer?.createdAt || new Date().toISOString(),
    };
    
    db.saveCustomer(customer);
    showToast('success', editCustomer ? 'مشتری ویرایش شد' : 'مشتری اضافه شد');
    setShowForm(false);
    loadCustomers();
  };

  const deleteCustomer = (id: string) => {
    if (!confirm('آیا از حذف این مشتری مطمئن هستید؟')) return;
    db.deleteCustomer(id);
    showToast('success', 'مشتری حذف شد');
    loadCustomers();
  };

  const totalCustomers = customers.length;
  const debtorsCount = customers.filter(c => c.debt > 0).length;
  const totalDebt = customers.reduce((sum, c) => sum + c.debt, 0);
  const totalPurchase = customers.reduce((sum, c) => sum + c.totalPurchase, 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">مشتریان</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت اطلاعات مشتریان</p>
        </div>
        {hasPermission('customers.create') && (
          <Button variant="primary" onClick={openNew}>
            <Plus size={18} />
            مشتری جدید
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل مشتریان</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalCustomers}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">بدهکاران</p>
              <p className="text-xl font-bold text-amber-600">{debtorsCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">مطالبات</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalDebt, settings.currency)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">جمع فروش</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalPurchase, settings.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">جستجو و فیلتر</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو نام، موبایل، کد ملی..." 
              className="input pr-12" 
            />
          </div>
          <select 
            value={debtFilter} 
            onChange={e => setDebtFilter(e.target.value)}
            className="input"
          >
            <option value="all">همه مشتریان</option>
            <option value="debt">بدهکاران</option>
            <option value="clear">تسویه شده</option>
          </select>
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-bold text-lg text-slate-900 dark:text-white">
                    {c.firstName} {c.lastName}
                  </p>
                  {c.debt > 0 && (
                    <span className="badge badge-warning">بدهکار</span>
                  )}
                  {c.debt === 0 && c.invoiceCount > 0 && (
                    <span className="badge badge-success">تسویه شده</span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {c.mobile && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} />
                      {c.mobile}
                    </p>
                  )}
                  {c.nationalId && (
                    <p className="flex items-center gap-2">
                      <FileText size={14} />
                      کد ملی: {c.nationalId}
                    </p>
                  )}
                  {c.address && (
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      {c.address}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {c.invoiceCount} فاکتور
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    خرید: {formatCurrency(c.totalPurchase, settings.currency)}
                  </span>
                  {c.debt > 0 && (
                    <span className="text-sm font-bold text-red-600">
                      بدهی: {formatCurrency(c.debt, settings.currency)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setViewCustomer(c)}>
                  <Eye size={16} />
                </Button>
                {hasPermission('customers.edit') && (
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                    <Edit size={16} className="text-blue-500" />
                  </Button>
                )}
                {hasPermission('customers.edit') && (
                  <Button variant="ghost" size="sm" onClick={() => deleteCustomer(c.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Users size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">مشتری‌ای یافت نشد</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {search || debtFilter !== 'all' 
                ? 'فیلترهای خود را تغییر دهید' 
                : 'اولین مشتری خود را اضافه کنید'}
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editCustomer ? 'ویرایش مشتری' : 'مشتری جدید'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="نام *"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  placeholder="علی"
                />
                <Input
                  label="نام خانوادگی"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  placeholder="محمدی"
                />
              </div>
              <Input
                label="موبایل"
                type="tel"
                value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })}
                placeholder="09121234567"
              />
              <Input
                label="کد ملی"
                value={form.nationalId}
                onChange={e => setForm({ ...form, nationalId: e.target.value })}
                placeholder="0012345678"
              />
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">آدرس</label>
                <textarea 
                  value={form.address} 
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="input" 
                  rows={2}
                  placeholder="آدرس کامل..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">یادداشت</label>
                <textarea 
                  value={form.notes} 
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="input" 
                  rows={2}
                  placeholder="توضیحات اضافی..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={save}>
                  {editCustomer ? 'ذخیره تغییرات' : 'افزودن مشتری'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {viewCustomer.firstName} {viewCustomer.lastName}
              </h3>
              <button onClick={() => setViewCustomer(null)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {viewCustomer.mobile && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">موبایل</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone size={16} className="text-slate-400" />
                      {viewCustomer.mobile}
                    </p>
                  </div>
                )}
                {viewCustomer.nationalId && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">کد ملی</p>
                    <p className="font-medium">{viewCustomer.nationalId}</p>
                  </div>
                )}
              </div>
              
              {viewCustomer.address && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">آدرس</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    {viewCustomer.address}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تعداد فاکتور</p>
                  <p className="text-2xl font-bold text-blue-600">{viewCustomer.invoiceCount}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جمع خرید</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(viewCustomer.totalPurchase, settings.currency)}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">بدهی</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(viewCustomer.debt, settings.currency)}</p>
                </div>
              </div>

              {viewCustomer.notes && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">یادداشت</p>
                  <p className="text-sm">{viewCustomer.notes}</p>
                </div>
              )}

              {viewCustomer.lastPurchase && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">آخرین خرید</p>
                  <p className="text-sm">{toJalali(viewCustomer.lastPurchase)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

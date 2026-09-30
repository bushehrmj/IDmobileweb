import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Customer } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Edit, Trash2, X, User, Phone, DollarSign } from 'lucide-react';

export default function Customers() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({ firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: '' });

  useEffect(() => { loadCustomers(); }, []);
  const loadCustomers = () => setCustomers(db.getCustomers().reverse());

  const filtered = customers.filter(c =>
    c.firstName.includes(search) || c.lastName.includes(search) || c.mobile?.includes(search)
  );

  const openNew = () => { setEditCustomer(null); setForm({ firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: '' }); setShowForm(true); };
  const openEdit = (c: Customer) => { setEditCustomer(c); setForm({ ...c }); setShowForm(true); };

  const save = () => {
    if (!form.firstName?.trim() && !form.lastName?.trim()) { showToast('error', 'نام الزامی است'); return; }
    const customer: Customer = {
      id: editCustomer?.id || uuidv4(),
      firstName: form.firstName || '', lastName: form.lastName || '',
      mobile: form.mobile || '', nationalId: form.nationalId || '',
      address: form.address || '', notes: form.notes || '',
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

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">مشتریان</h2>
        {hasPermission('customers.create') && (
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus size={16} /> مشتری جدید
          </button>
        )}
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="جستجو نام، موبایل..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-sm">{c.firstName} {c.lastName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {c.mobile && <span className="flex items-center gap-1"><Phone size={10} />{c.mobile}</span>}
                  <span>{c.invoiceCount} فاکتور</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                    خرید: {formatCurrency(c.totalPurchase, settings.currency)}
                  </span>
                  {c.debt > 0 && (
                    <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                      بدهی: {formatCurrency(c.debt, settings.currency)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {hasPermission('customers.edit') && (
                  <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={14} /></button>
                )}
                {hasPermission('customers.edit') && (
                  <button onClick={() => deleteCustomer(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">مشتری‌ای یافت نشد</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold">{editCustomer ? 'ویرایش مشتری' : 'مشتری جدید'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">نام *</label>
                  <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">نام خانوادگی</label>
                  <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">موبایل</label>
                  <input type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">کد ملی</label>
                  <input type="text" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">آدرس</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500">یادداشت</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
              </div>
              <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                {editCustomer ? 'ذخیره تغییرات' : 'افزودن مشتری'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

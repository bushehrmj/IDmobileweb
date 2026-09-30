import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalaliFull } from '../lib/auth';
import { db, type Payment } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, CreditCard, X } from 'lucide-react';

export default function Payments() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerName: '', type: 'received' as 'received' | 'paid',
    amount: 0, method: 'cash' as 'cash' | 'card' | 'transfer',
    reference: '', notes: '',
  });

  useEffect(() => { loadPayments(); }, []);
  const loadPayments = () => setPayments(db.getPayments().reverse());

  const filtered = payments.filter(p =>
    p.customerName.includes(search) || p.reference.includes(search)
  );

  const save = () => {
    if (!form.customerName.trim()) { showToast('error', 'نام مشتری الزامی است'); return; }
    if (!form.amount || form.amount <= 0) { showToast('error', 'مبلغ الزامی است'); return; }

    const payment: Payment = {
      id: uuidv4(),
      customerId: '',
      customerName: form.customerName,
      type: form.type,
      amount: form.amount,
      method: form.method,
      reference: form.reference,
      referenceType: 'sale',
      referenceId: '',
      userId: user?.id || '',
      date: new Date().toISOString(),
      notes: form.notes,
    };

    db.savePayment(payment);
    db.addAuditLog({
      id: uuidv4(), userId: user?.id || '', userName: user?.fullName || '',
      action: 'create_payment', entity: 'payment', entityId: payment.id,
      newValue: `${form.type === 'received' ? 'دریافت' : 'پرداخت'} ${formatCurrency(form.amount, settings.currency)} از ${form.customerName}`,
      ip: '127.0.0.1', date: new Date().toISOString(),
    });

    showToast('success', 'پرداخت ثبت شد');
    setShowForm(false);
    setForm({ customerName: '', type: 'received', amount: 0, method: 'cash', reference: '', notes: '' });
    loadPayments();
  };

  const totalReceived = payments.filter(p => p.type === 'received').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter(p => p.type === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">پرداخت‌ها</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
          <Plus size={16} /> ثبت پرداخت
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500">جمع دریافتی</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalReceived, settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500">جمع پرداختی</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalPaid, settings.currency)}</p>
        </div>
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="جستجو..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />

      <div className="space-y-2">
        {filtered.slice(0, 50).map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard size={14} className={p.type === 'received' ? 'text-green-500' : 'text-red-500'} />
                <p className="text-sm font-medium">{p.customerName}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.type === 'received' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                  {p.type === 'received' ? 'دریافت' : 'پرداخت'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{toJalaliFull(p.date)} | {p.method === 'cash' ? 'نقد' : p.method === 'card' ? 'کارت' : 'انتقال'}</p>
            </div>
            <p className={`font-bold ${p.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(p.amount, settings.currency)}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">پرداختی یافت نشد</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">ثبت پرداخت</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>
            <div>
              <label className="text-xs text-slate-500">نوع</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setForm({ ...form, type: 'received' })} className={`flex-1 py-2 rounded-lg text-sm ${form.type === 'received' ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>دریافت</button>
                <button onClick={() => setForm({ ...form, type: 'paid' })} className={`flex-1 py-2 rounded-lg text-sm ${form.type === 'paid' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>پرداخت</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">نام مشتری / طرف</label>
              <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">مبلغ</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500">روش</label>
                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value as typeof form.method })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                  <option value="cash">نقد</option>
                  <option value="card">کارت</option>
                  <option value="transfer">انتقال</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">شماره مرجع</label>
              <input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
            <div>
              <label className="text-xs text-slate-500">یادداشت</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
            <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">ثبت</button>
          </div>
        </div>
      )}
    </div>
  );
}

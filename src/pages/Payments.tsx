import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Payment } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, Search, X, CreditCard, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, TrendingDown, Filter
} from 'lucide-react';

export default function Payments() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'received' | 'paid'>('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    type: 'received' as 'received' | 'paid',
    amount: 0,
    method: 'cash' as 'cash' | 'card' | 'transfer' | 'check' | 'other',
    reference: '',
    notes: '',
  });

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = () => setPayments(db.getPayments().reverse());

  const filtered = payments.filter(p => {
    const matchSearch = p.customerName.includes(search) || p.reference.includes(search);
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchSearch && matchType && matchMethod;
  });

  const totalReceived = filtered.filter(p => p.type === 'received').reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = filtered.filter(p => p.type === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const netFlow = totalReceived - totalPaid;

  const save = () => {
    if (!form.customerName.trim()) {
      showToast('error', 'نام مشتری/طرف الزامی است');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      showToast('error', 'مبلغ الزامی است');
      return;
    }

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
      id: uuidv4(),
      userId: user?.id || '',
      userName: user?.fullName || '',
      action: 'create_payment',
      entity: 'payment',
      entityId: payment.id,
      newValue: `${form.type === 'received' ? 'دریافت' : 'پرداخت'} ${formatCurrency(form.amount, settings.currency)} از ${form.customerName}`,
      ip: '127.0.0.1',
      date: new Date().toISOString(),
    });

    showToast('success', 'پرداخت ثبت شد');
    setShowForm(false);
    setForm({
      customerName: '',
      type: 'received',
      amount: 0,
      method: 'cash',
      reference: '',
      notes: '',
    });
    loadPayments();
  };

  const methodLabels: Record<string, string> = {
    cash: 'نقدی',
    card: 'کارتخوان',
    transfer: 'کارت‌به‌کارت',
    check: 'چک',
    other: 'سایر',
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">پرداخت‌ها</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت دریافت‌ها و پرداخت‌ها</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          ثبت پرداخت
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <ArrowDownCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">جمع دریافتی</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalReceived, settings.currency)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <ArrowUpCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">جمع پرداختی</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalPaid, settings.currency)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 ${netFlow >= 0 ? 'bg-blue-500' : 'bg-orange-500'} rounded-xl flex items-center justify-center`}>
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">جریان خالص</p>
              <p className={`text-xl font-bold ${netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(Math.abs(netFlow), settings.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">فیلتر</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو نام، مرجع..."
              className="input pr-12"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
            className="input"
          >
            <option value="all">همه انواع</option>
            <option value="received">دریافتی</option>
            <option value="paid">پرداختی</option>
          </select>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="input"
          >
            <option value="all">همه روش‌ها</option>
            {Object.entries(methodLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  p.type === 'received' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {p.type === 'received' ? (
                    <ArrowDownCircle size={24} className="text-white" />
                  ) : (
                    <ArrowUpCircle size={24} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">
                    {p.customerName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {methodLabels[p.method]} | {toJalali(p.date)}
                  </p>
                  {p.reference && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      مرجع: {p.reference}
                    </p>
                  )}
                  {p.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {p.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-left">
                <p className={`text-xl font-bold ${
                  p.type === 'received' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {p.type === 'received' ? '+' : '-'}
                  {formatCurrency(p.amount, settings.currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <CreditCard size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">پرداختی یافت نشد</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {search || typeFilter !== 'all' || methodFilter !== 'all'
                ? 'فیلترهای خود را تغییر دهید'
                : 'اولین پرداخت خود را ثبت کنید'}
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">ثبت پرداخت</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نوع</label>
                <div className="flex gap-2">
                  <Button
                    variant={form.type === 'received' ? 'success' : 'outline'}
                    className="flex-1"
                    onClick={() => setForm({ ...form, type: 'received' })}
                  >
                    <ArrowDownCircle size={18} />
                    دریافت
                  </Button>
                  <Button
                    variant={form.type === 'paid' ? 'danger' : 'outline'}
                    className="flex-1"
                    onClick={() => setForm({ ...form, type: 'paid' })}
                  >
                    <ArrowUpCircle size={18} />
                    پرداخت
                  </Button>
                </div>
              </div>

              <Input
                label="نام مشتری / طرف"
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                placeholder="مثال: علی رضایی"
              />

              <Input
                label="مبلغ"
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="مبلغ را وارد کنید"
              />

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">روش پرداخت</label>
                <select
                  value={form.method}
                  onChange={e => setForm({ ...form, method: e.target.value as typeof form.method })}
                  className="input"
                >
                  {Object.entries(methodLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <Input
                label="شماره مرجع"
                value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
                placeholder="شماره فاکتور، پیگیری و..."
              />

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">توضیحات</label>
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
                  ثبت
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

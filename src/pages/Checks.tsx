import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { financialDb, type Check } from '../lib/financialDb';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Checks() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'received' | 'paid'>('received');
  const [checks, setChecks] = useState<Check[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'received' as 'received' | 'paid',
    number: '', bankName: '', amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', partyName: '', description: '',
  });

  useEffect(() => { loadChecks(); }, []);

  const loadChecks = () => setChecks(financialDb.getChecks().reverse());

  const receivedChecks = checks.filter(c => c.type === 'received');
  const paidChecks = checks.filter(c => c.type === 'paid');

  const totalReceived = receivedChecks.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = paidChecks.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  // Alerts
  const today = new Date();
  const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueToday = checks.filter(c => {
    const due = new Date(c.dueDate);
    return due.toDateString() === today.toDateString() && c.status === 'pending';
  });
  const dueThisWeek = checks.filter(c => {
    const due = new Date(c.dueDate);
    return due >= today && due <= weekLater && c.status === 'pending';
  });
  const overdue = checks.filter(c => {
    const due = new Date(c.dueDate);
    return due < today && c.status === 'pending';
  });

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

  const save = () => {
    if (!form.number) { showToast('error', 'شماره چک الزامی است'); return; }
    if (!form.amount || form.amount <= 0) { showToast('error', 'مبلغ الزامی است'); return; }
    if (!form.dueDate) { showToast('error', 'تاریخ سررسید الزامی است'); return; }

    const check: Check = {
      id: uuidv4(),
      type: form.type,
      number: form.number,
      bankName: form.bankName,
      amount: form.amount,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      partyName: form.partyName,
      description: form.description,
      status: 'pending',
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    financialDb.saveCheck(check);
    showToast('success', 'چک ثبت شد');
    setShowForm(false);
    setForm({ type: 'received', number: '', bankName: '', amount: 0, issueDate: new Date().toISOString().split('T')[0], dueDate: '', partyName: '', description: '' });
    loadChecks();
  };

  const updateStatus = (check: Check, newStatus: Check['status']) => {
    check.status = newStatus;
    financialDb.saveCheck(check);
    showToast('success', 'وضعیت چک به‌روز شد');
    loadChecks();
  };

  const statusLabels: Record<string, string> = {
    pending: 'در انتظار', deposited: 'وصول شد', cleared: 'پاس شده',
    bounced: 'برگشتی', transferred: 'واگذار', voided: 'باطل',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    deposited: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    cleared: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    bounced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    transferred: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    voided: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">مدیریت چک‌ها</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
          <Plus size={16} /> ثبت چک
        </button>
      </div>

      {/* Alerts */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} /> {overdue.length} چک سررسید گذشته
            </div>
          )}
          {dueToday.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock size={16} /> {dueToday.length} چک سررسید امروز
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-sm mb-1">چک‌های دریافتی در انتظار</p>
          <p className="text-xl font-bold">{formatCurrency(totalReceived, currency)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-sm mb-1">چک‌های پرداختی در انتظار</p>
          <p className="text-xl font-bold">{formatCurrency(totalPaid, currency)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('received')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'received' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          چک‌های دریافتی ({receivedChecks.length})
        </button>
        <button onClick={() => setActiveTab('paid')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'paid' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          چک‌های پرداختی ({paidChecks.length})
        </button>
      </div>

      {/* Checks List */}
      <div className="space-y-2">
        {(activeTab === 'received' ? receivedChecks : paidChecks).map(check => (
          <div key={check.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">چک #{check.number}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[check.status]}`}>
                    {statusLabels[check.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{check.bankName} | {check.partyName}</p>
                <p className="text-xs text-slate-500">سررسید: {toJalali(check.dueDate)}</p>
                {check.description && <p className="text-xs text-slate-400 mt-1">{check.description}</p>}
              </div>
              <div className="text-left">
                <p className={`text-lg font-bold ${check.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(check.amount, currency)}
                </p>
                {check.status === 'pending' && (
                  <select value={check.status} onChange={e => updateStatus(check, e.target.value as Check['status'])}
                    className="mt-1 text-xs px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700">
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
        {(activeTab === 'received' ? receivedChecks : paidChecks).length === 0 && (
          <p className="text-center text-slate-500 py-8">چکی ثبت نشده</p>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">ثبت چک</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>

            <div>
              <label className="text-xs text-slate-500">نوع چک</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setForm({ ...form, type: 'received' })}
                  className={`flex-1 py-2 rounded-lg text-sm ${form.type === 'received' ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  دریافتی
                </button>
                <button onClick={() => setForm({ ...form, type: 'paid' })}
                  className={`flex-1 py-2 rounded-lg text-sm ${form.type === 'paid' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  پرداختی
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">شماره چک *</label>
                <input type="text" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500">بانک</label>
                <input type="text" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500">مبلغ *</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">تاریخ صدور</label>
                <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500">تاریخ سررسید *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500">{form.type === 'received' ? 'از طرف' : 'در وجه'}</label>
              <input type="text" value={form.partyName} onChange={e => setForm({ ...form, partyName: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>

            <div>
              <label className="text-xs text-slate-500">توضیحات</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>

            <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
              ثبت چک
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

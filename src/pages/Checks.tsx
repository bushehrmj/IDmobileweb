import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { financialDb, type Check } from '../lib/financialDb';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, X, FileText, AlertTriangle, CheckCircle, Clock,
  Filter, Calendar
} from 'lucide-react';

export default function Checks() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'received' | 'paid'>('received');
  const [checks, setChecks] = useState<Check[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState<any>({
    type: 'received' as 'received' | 'paid',
    number: '',
    bankName: '',
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    partyName: '',
    description: '',
  });

  useEffect(() => { 
    loadChecks(); 
  }, []);

  const loadChecks = () => setChecks(financialDb.getChecks().reverse());

  const receivedChecks = checks.filter(c => c.type === 'received');
  const paidChecks = checks.filter(c => c.type === 'paid');

  const filteredChecks = (activeTab === 'received' ? receivedChecks : paidChecks).filter(c => {
    const matchSearch = c.number.includes(search) || c.partyName.includes(search) || c.bankName.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalReceived = receivedChecks.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = paidChecks.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

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
    resetForm();
    loadChecks();
  };

  const resetForm = () => {
    setForm({
      type: 'received',
      number: '',
      bankName: '',
      amount: 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      partyName: '',
      description: '',
    });
  };

  const updateStatus = (check: Check, newStatus: Check['status']) => {
    check.status = newStatus;
    financialDb.saveCheck(check);
    showToast('success', 'وضعیت چک به‌روز شد');
    loadChecks();
  };

  const statusLabels: Record<string, string> = {
    pending: 'در انتظار',
    deposited: 'وصل شد',
    cleared: 'پاس شده',
    bounced: 'برگشتی',
    transferred: 'واگذار',
    voided: 'باطل',
  };

  const statusColors: Record<string, string> = {
    pending: 'badge-warning',
    deposited: 'badge-info',
    cleared: 'badge-success',
    bounced: 'badge-error',
    transferred: 'badge-info',
    voided: 'badge-error',
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">مدیریت چک‌ها</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت چک‌های دریافتی و پرداختی</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          ثبت چک
        </Button>
      </div>

      {/* Alerts */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  {overdue.length} چک سررسید گذشته
                </span>
              </div>
            </div>
          )}
          {dueToday.length > 0 && (
            <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {dueToday.length} چک سررسید امروز
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-gradient-teal p-6 text-white rounded-2xl">
          <p className="text-sm mb-2">چک‌های دریافتی در انتظار</p>
          <p className="text-3xl font-bold">{formatCurrency(totalReceived, currency)}</p>
          <p className="text-xs mt-2 opacity-80">{receivedChecks.filter(c => c.status === 'pending').length} چک</p>
        </div>
        <div className="card-gradient-orange p-6 text-white rounded-2xl">
          <p className="text-sm mb-2">چک‌های پرداختی در انتظار</p>
          <p className="text-3xl font-bold">{formatCurrency(totalPaid, currency)}</p>
          <p className="text-xs mt-2 opacity-80">{paidChecks.filter(c => c.status === 'pending').length} چک</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 p-2">
          <button 
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'received' 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            چک‌های دریافتی ({receivedChecks.length})
          </button>
          <button 
            onClick={() => setActiveTab('paid')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'paid' 
                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            چک‌های پرداختی ({paidChecks.length})
          </button>
        </div>

        <div className="p-5">
          {/* Filters */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={20} className="text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">فیلتر</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="جستجو شماره، نام، بانک..." 
                  className="input" 
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">همه وضعیت‌ها</option>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checks List */}
          <div className="space-y-3">
            {filteredChecks.map(check => (
              <div key={check.id} className="card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={20} className={check.type === 'received' ? 'text-green-500' : 'text-red-500'} />
                      <p className="font-bold text-lg text-slate-900 dark:text-white">
                        چک #{check.number}
                      </p>
                      <span className={`badge ${statusColors[check.status]}`}>
                        {statusLabels[check.status]}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <p>{check.bankName} | {check.partyName}</p>
                      <p>سررسید: {toJalali(check.dueDate)}</p>
                      {check.description && <p className="text-xs">{check.description}</p>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-xl font-bold ${check.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(check.amount, currency)}
                    </p>
                    {check.status === 'pending' && (
                      <select 
                        value={check.status} 
                        onChange={e => updateStatus(check, e.target.value as Check['status'])}
                        className="mt-2 text-xs px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      >
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredChecks.length === 0 && (
              <div className="text-center py-12">
                <FileText size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-lg font-medium text-slate-500 dark:text-slate-400">چکی ثبت نشده</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">ثبت چک</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نوع چک</label>
                <div className="flex gap-2">
                  <Button
                    variant={form.type === 'received' ? 'success' : 'outline'}
                    className="flex-1"
                    onClick={() => setForm({ ...form, type: 'received' })}
                  >
                    دریافتی
                  </Button>
                  <Button
                    variant={form.type === 'paid' ? 'danger' : 'outline'}
                    className="flex-1"
                    onClick={() => setForm({ ...form, type: 'paid' })}
                  >
                    پرداختی
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="شماره چک *"
                  value={form.number}
                  onChange={e => setForm({ ...form, number: e.target.value })}
                />
                <Input
                  label="بانک"
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                />
              </div>

              <Input
                label="مبلغ *"
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="تاریخ صدور"
                  type="date"
                  value={form.issueDate}
                  onChange={e => setForm({ ...form, issueDate: e.target.value })}
                />
                <Input
                  label="تاریخ سررسید *"
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              <Input
                label={form.type === 'received' ? 'از طرف' : 'در وجه'}
                value={form.partyName}
                onChange={e => setForm({ ...form, partyName: e.target.value })}
              />

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">توضیحات</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={save}>
                  ثبت چک
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

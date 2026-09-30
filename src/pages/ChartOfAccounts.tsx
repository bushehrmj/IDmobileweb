import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { financialDb, type Account } from '../lib/financialDb';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, X, BookOpen } from 'lucide-react';

export default function ChartOfAccounts() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({
    code: '', name: '', type: 'asset' as Account['type'], parentId: '', isSystem: false,
  });

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = () => setAccounts(financialDb.getAccounts());

  const openNew = () => {
    setEditAccount(null);
    setForm({ code: '', name: '', type: 'asset', parentId: '', isSystem: false });
    setShowForm(true);
  };

  const openEdit = (a: Account) => {
    setEditAccount(a);
    setForm({ code: a.code, name: a.name, type: a.type, parentId: a.parentId || '', isSystem: a.isSystem });
    setShowForm(true);
  };

  const save = () => {
    if (!form.code.trim()) { showToast('error', 'کد حساب الزامی است'); return; }
    if (!form.name.trim()) { showToast('error', 'نام حساب الزامی است'); return; }

    const account: Account = {
      id: editAccount?.id || uuidv4(),
      code: form.code,
      name: form.name,
      type: form.type,
      parentId: form.parentId || undefined,
      isSystem: form.isSystem,
      balance: editAccount?.balance || 0,
      active: true,
      createdAt: editAccount?.createdAt || new Date().toISOString(),
    };

    financialDb.saveAccount(account);
    showToast('success', editAccount ? 'حساب ویرایش شد' : 'حساب ایجاد شد');
    setShowForm(false);
    loadAccounts();
  };

  const typeLabels: Record<string, string> = {
    asset: 'دارایی', liability: 'بدهی', equity: 'حقوق مالکانه', income: 'درآمد', expense: 'هزینه',
  };

  const typeColors: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    liability: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    equity: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    income: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    expense: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  };

  // Group accounts by type
  const grouped = {
    asset: accounts.filter(a => a.type === 'asset'),
    liability: accounts.filter(a => a.type === 'liability'),
    equity: accounts.filter(a => a.type === 'equity'),
    income: accounts.filter(a => a.type === 'income'),
    expense: accounts.filter(a => a.type === 'expense'),
  };

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">سرفصل حساب‌ها</h2>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
          <Plus size={16} /> حساب جدید
        </button>
      </div>

      {Object.entries(grouped).map(([type, accs]) => (
        <div key={type} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className={`px-4 py-2 ${typeColors[type]} flex items-center justify-between`}>
            <span className="font-bold text-sm">{typeLabels[type]}</span>
            <span className="text-xs">{accs.length} حساب</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {accs.map(a => (
              <div key={a.id} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{a.code}</span>
                  <span className="text-sm">{a.name}</span>
                  {a.isSystem && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">سیستمی</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${a.balance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-500'}`}>
                    {formatCurrency(Math.abs(a.balance), currency)}
                  </span>
                  {hasPermission('financial.chart_of_accounts') && (
                    <button onClick={() => openEdit(a)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                      <Edit size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{editAccount ? 'ویرایش حساب' : 'حساب جدید'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">کد حساب *</label>
                <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500">نوع حساب</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Account['type'] })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                  <option value="asset">دارایی</option>
                  <option value="liability">بدهی</option>
                  <option value="equity">حقوق مالکانه</option>
                  <option value="income">درآمد</option>
                  <option value="expense">هزینه</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">نام حساب *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isSystem} onChange={e => setForm({ ...form, isSystem: e.target.checked })} className="rounded" />
              حساب سیستمی
            </label>
            <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
              {editAccount ? 'ذخیره تغییرات' : 'ایجاد حساب'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

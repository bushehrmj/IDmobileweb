import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { financialDb, type Account } from '../lib/financialDb';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Plus, Edit, X, BookOpen, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

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

  const typeIcons: Record<string, any> = {
    asset: TrendingUp,
    liability: TrendingDown,
    equity: DollarSign,
    income: TrendingUp,
    expense: TrendingDown,
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
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">سرفصل حساب‌ها</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت ساختار حساب‌های حسابداری</p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <Plus size={18} />
          حساب جدید
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(grouped).map(([type, accs]) => {
          const TypeIcon = typeIcons[type as keyof typeof typeIcons];
          return (
            <div key={type} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[type]}`}>
                  <TypeIcon size={16} />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{typeLabels[type]}</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{accs.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">حساب</p>
            </div>
          );
        })}
      </div>

      {/* Accounts by Type */}
      {Object.entries(grouped).map(([type, accs]) => (
        <div key={type} className="card overflow-hidden">
          <div className={`px-5 py-3 ${typeColors[type]} flex items-center justify-between`}>
            <span className="font-bold text-sm flex items-center gap-2">
              {React.createElement(typeIcons[type as keyof typeof typeIcons], { size: 18 })}
              {typeLabels[type]}
            </span>
            <span className="text-xs">{accs.length} حساب</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {accs.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-16">{a.code}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{a.name}</span>
                  {a.isSystem && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">سیستمی</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${a.balance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-500'}`}>
                    {formatCurrency(Math.abs(a.balance), currency)}
                  </span>
                  {hasPermission('financial.chart_of_accounts') && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                      <Edit size={14} className="text-blue-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editAccount ? 'ویرایش حساب' : 'حساب جدید'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="کد حساب *"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="مثال: 1100"
                />
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نوع حساب</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({ ...form, type: e.target.value as Account['type'] })}
                    className="input"
                  >
                    <option value="asset">دارایی</option>
                    <option value="liability">بدهی</option>
                    <option value="equity">حقوق مالکانه</option>
                    <option value="income">درآمد</option>
                    <option value="expense">هزینه</option>
                  </select>
                </div>
              </div>
              <Input
                label="نام حساب *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: صندوق اصلی"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.isSystem} 
                  onChange={e => setForm({ ...form, isSystem: e.target.checked })} 
                  className="w-4 h-4 rounded" 
                />
                <span className="text-sm font-medium">حساب سیستمی</span>
              </label>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={save}>
                  {editAccount ? 'ذخیره تغییرات' : 'ایجاد حساب'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

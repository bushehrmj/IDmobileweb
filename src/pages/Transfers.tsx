import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { financialDb, type Transfer } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, X, ArrowRightLeft, Wallet, CreditCard
} from 'lucide-react';

export default function Transfers() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    fromType: 'cash' as 'cash' | 'bank',
    fromId: '',
    toType: 'bank' as 'cash' | 'bank',
    toId: '',
    description: '',
  });

  useEffect(() => { 
    loadTransfers(); 
  }, []);

  const loadTransfers = () => setTransfers(financialDb.getTransfers().reverse());

  const cashAccounts = financialDb.getCashAccounts();
  const bankAccounts = financialDb.getBankAccounts();

  const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0);

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

  const save = () => {
    if (!form.amount || form.amount <= 0) { 
      showToast('error', 'مبلغ الزامی است'); 
      return; 
    }
    if (!form.fromId) { 
      showToast('error', 'حساب مبدأ الزامی است'); 
      return; 
    }
    if (!form.toId) { 
      showToast('error', 'حساب مقصد الزامی است'); 
      return; 
    }
    if (form.fromId === form.toId) { 
      showToast('error', 'حساب مبدأ و مقصد نمی‌توانند یکسان باشند'); 
      return; 
    }

    const transfer: Transfer = {
      id: uuidv4(),
      date: form.date,
      amount: form.amount,
      fromType: form.fromType,
      fromId: form.fromId,
      toType: form.toType,
      toId: form.toId,
      description: form.description,
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    financialDb.saveTransfer(transfer);

    // Create accounting entry
    const fromAccountCode = form.fromType === 'cash' ? '1110' : '1210';
    const toAccountCode = form.toType === 'cash' ? '1110' : '1210';
    
    AccountingService.recordTransfer(
      transfer.id,
      transfer.amount,
      fromAccountCode,
      toAccountCode,
      user?.id || '',
      user?.fullName || ''
    );

    // Update balances
    if (form.fromType === 'cash') {
      const fromAccount = cashAccounts.find(c => c.id === form.fromId);
      if (fromAccount) {
        fromAccount.currentBalance -= form.amount;
        financialDb.saveCashAccount(fromAccount);
      }
    } else {
      const fromAccount = bankAccounts.find(b => b.id === form.fromId);
      if (fromAccount) {
        fromAccount.currentBalance -= form.amount;
        financialDb.saveBankAccount(fromAccount);
      }
    }

    if (form.toType === 'cash') {
      const toAccount = cashAccounts.find(c => c.id === form.toId);
      if (toAccount) {
        toAccount.currentBalance += form.amount;
        financialDb.saveCashAccount(toAccount);
      }
    } else {
      const toAccount = bankAccounts.find(b => b.id === form.toId);
      if (toAccount) {
        toAccount.currentBalance += form.amount;
        financialDb.saveBankAccount(toAccount);
      }
    }

    showToast('success', 'انتقال ثبت شد');
    setShowForm(false);
    resetForm();
    loadTransfers();
  };

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      fromType: 'cash',
      fromId: '',
      toType: 'bank',
      toId: '',
      description: '',
    });
  };

  const getAccountName = (type: 'cash' | 'bank', id: string): string => {
    if (type === 'cash') {
      const account = cashAccounts.find(c => c.id === id);
      return account?.name || 'صندوق';
    } else {
      const account = bankAccounts.find(b => b.id === id);
      return account?.name || 'بانک';
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">انتقال بین حساب‌ها</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">انتقال وجه بین صندوق و بانک</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          انتقال جدید
        </Button>
      </div>

      {/* Summary */}
      <div className="card-gradient-purple p-6 text-white rounded-2xl">
        <p className="text-sm mb-2">مجموع انتقال‌ها</p>
        <p className="text-3xl font-bold">{formatCurrency(totalTransfers, currency)}</p>
        <p className="text-xs mt-2 opacity-80">{transfers.length} انتقال</p>
      </div>

      {/* Transfers List */}
      <div className="space-y-3">
        {transfers.map(transfer => (
          <div key={transfer.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transfer.fromType === 'cash' ? 'bg-teal-500' : 'bg-purple-500'
                    }`}>
                      {transfer.fromType === 'cash' ? (
                        <Wallet size={20} className="text-white" />
                      ) : (
                        <CreditCard size={20} className="text-white" />
                      )}
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {getAccountName(transfer.fromType, transfer.fromId)}
                    </span>
                  </div>
                  <ArrowRightLeft size={20} className="text-blue-500" />
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transfer.toType === 'cash' ? 'bg-teal-500' : 'bg-purple-500'
                    }`}>
                      {transfer.toType === 'cash' ? (
                        <Wallet size={20} className="text-white" />
                      ) : (
                        <CreditCard size={20} className="text-white" />
                      )}
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {getAccountName(transfer.toType, transfer.toId)}
                    </span>
                  </div>
                </div>
                {transfer.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{transfer.description}</p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">{toJalali(transfer.date)}</p>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(transfer.amount, currency)}</p>
              </div>
            </div>
          </div>
        ))}
        {transfers.length === 0 && (
          <div className="card p-12 text-center">
            <ArrowRightLeft size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">انتقالی ثبت نشده</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">اولین انتقال خود را ثبت کنید</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">انتقال بین حساب‌ها</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Input
                label="تاریخ"
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />

              <Input
                label="مبلغ"
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="مبلغ را وارد کنید"
              />

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">از حساب</label>
                <select 
                  value={form.fromType} 
                  onChange={e => setForm({ ...form, fromType: e.target.value as 'cash' | 'bank', fromId: '' })}
                  className="input mb-2"
                >
                  <option value="cash">صندوق</option>
                  <option value="bank">بانک</option>
                </select>
                <select 
                  value={form.fromId} 
                  onChange={e => setForm({ ...form, fromId: e.target.value })}
                  className="input"
                >
                  <option value="">انتخاب حساب</option>
                  {form.fromType === 'cash' ? (
                    cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  ) : (
                    bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">به حساب</label>
                <select 
                  value={form.toType} 
                  onChange={e => setForm({ ...form, toType: e.target.value as 'cash' | 'bank', toId: '' })}
                  className="input mb-2"
                >
                  <option value="cash">صندوق</option>
                  <option value="bank">بانک</option>
                </select>
                <select 
                  value={form.toId} 
                  onChange={e => setForm({ ...form, toId: e.target.value })}
                  className="input"
                >
                  <option value="">انتخاب حساب</option>
                  {form.toType === 'cash' ? (
                    cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  ) : (
                    bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">توضیحات</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="توضیحات اضافی..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={save}>
                  ثبت انتقال
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalaliFull } from '../lib/auth';
import { financialDb, type Transfer } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { v4 as uuidv4 } from 'uuid';
import { ArrowRightLeft, Plus, X } from 'lucide-react';

export default function Transfers() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    fromType: 'cash' as 'cash' | 'bank',
    fromId: '',
    toType: 'bank' as 'cash' | 'bank',
    toId: '',
    description: '',
  });

  useEffect(() => { loadTransfers(); }, []);

  const loadTransfers = () => setTransfers(financialDb.getTransfers().reverse());

  const cashAccounts = financialDb.getCashAccounts();
  const bankAccounts = financialDb.getBankAccounts();

  const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0);

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

  const save = () => {
    if (!form.amount || form.amount <= 0) { showToast('error', 'مبلغ الزامی است'); return; }
    if (!form.fromId) { showToast('error', 'حساب مبدأ الزامی است'); return; }
    if (!form.toId) { showToast('error', 'حساب مقصد الزامی است'); return; }
    if (form.fromId === form.toId) { showToast('error', 'حساب مبدأ و مقصد نمی‌توانند یکسان باشند'); return; }

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
    setForm({ date: new Date().toISOString().split('T')[0], amount: 0, fromType: 'cash', fromId: '', toType: 'bank', toId: '', description: '' });
    loadTransfers();
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
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ArrowRightLeft size={20} className="text-blue-500" />
          انتقال بین حساب‌ها
        </h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
          <Plus size={16} /> انتقال جدید
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <p className="text-sm mb-1">مجموع انتقال‌ها</p>
        <p className="text-2xl font-bold">{formatCurrency(totalTransfers, currency)}</p>
        <p className="text-xs mt-1 opacity-80">{transfers.length} انتقال</p>
      </div>

      {/* Transfers List */}
      <div className="space-y-2">
        {transfers.map(transfer => (
          <div key={transfer.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold">
                    {getAccountName(transfer.fromType, transfer.fromId)}
                  </span>
                  <ArrowRightLeft size={16} className="text-blue-500" />
                  <span className="text-sm font-bold">
                    {getAccountName(transfer.toType, transfer.toId)}
                  </span>
                </div>
                {transfer.description && (
                  <p className="text-xs text-slate-500">{transfer.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{toJalaliFull(transfer.date)}</p>
              </div>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(transfer.amount, currency)}</p>
            </div>
          </div>
        ))}
        {transfers.length === 0 && <p className="text-center text-slate-500 py-8">انتقالی ثبت نشده</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">انتقال بین حساب‌ها</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>

            <div>
              <label className="text-xs text-slate-500">تاریخ</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>

            <div>
              <label className="text-xs text-slate-500">مبلغ</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>

            <div>
              <label className="text-xs text-slate-500">از حساب</label>
              <select value={form.fromType} onChange={e => setForm({ ...form, fromType: e.target.value as 'cash' | 'bank', fromId: '' })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="cash">صندوق</option>
                <option value="bank">بانک</option>
              </select>
              <select value={form.fromId} onChange={e => setForm({ ...form, fromId: e.target.value })}
                className="w-full mt-2 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="">انتخاب حساب</option>
                {form.fromType === 'cash' ? (
                  cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                ) : (
                  bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                )}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">به حساب</label>
              <select value={form.toType} onChange={e => setForm({ ...form, toType: e.target.value as 'cash' | 'bank', toId: '' })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="cash">صندوق</option>
                <option value="bank">بانک</option>
              </select>
              <select value={form.toId} onChange={e => setForm({ ...form, toId: e.target.value })}
                className="w-full mt-2 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="">انتخاب حساب</option>
                {form.toType === 'cash' ? (
                  cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                ) : (
                  bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                )}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">توضیحات</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>

            <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
              ثبت انتقال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

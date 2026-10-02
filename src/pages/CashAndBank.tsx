import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { financialDb, type CashAccount, type BankAccount } from '../lib/financialDb';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, Edit, X, Wallet, CreditCard, TrendingUp, TrendingDown
} from 'lucide-react';

export default function CashAndBank() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'cash' | 'bank'>('cash');
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CashAccount | BankAccount | null>(null);
  const [form, setForm] = useState<any>({
    name: '',
    code: '',
    openingBalance: 0,
    // Bank specific
    bankName: '',
    accountNumber: '',
    cardNumber: '',
    iban: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCashAccounts(financialDb.getCashAccounts());
    setBankAccounts(financialDb.getBankAccounts());
  };

  const totalCash = cashAccounts.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalBank = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

  const openNew = () => {
    setEditItem(null);
    setForm({
      name: '',
      code: '',
      openingBalance: 0,
      bankName: '',
      accountNumber: '',
      cardNumber: '',
      iban: '',
    });
    setShowForm(true);
  };

  const openEdit = (item: CashAccount | BankAccount) => {
    setEditItem(item);
    setForm({
      name: item.name,
      code: (item as CashAccount).code || '',
      openingBalance: item.openingBalance,
      bankName: (item as BankAccount).bankName || '',
      accountNumber: (item as BankAccount).accountNumber || '',
      cardNumber: (item as BankAccount).cardNumber || '',
      iban: (item as BankAccount).iban || '',
    });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      showToast('error', 'نام حساب الزامی است');
      return;
    }

    if (activeTab === 'cash') {
      const cashAccount: CashAccount = {
        id: editItem?.id || uuidv4(),
        name: form.name,
        code: form.code || `CASH-${Date.now()}`,
        accountId: '',
        openingBalance: form.openingBalance || 0,
        currentBalance: editItem ? (editItem as CashAccount).currentBalance : (form.openingBalance || 0),
        responsibleUserId: user?.id || '',
        status: 'active',
        createdAt: editItem?.createdAt || new Date().toISOString(),
      };
      financialDb.saveCashAccount(cashAccount);
    } else {
      if (!form.bankName.trim()) {
        showToast('error', 'نام بانک الزامی است');
        return;
      }

      const bankAccount: BankAccount = {
        id: editItem?.id || uuidv4(),
        name: form.name,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        cardNumber: form.cardNumber,
        iban: form.iban,
        accountId: '',
        openingBalance: form.openingBalance || 0,
        currentBalance: editItem ? (editItem as BankAccount).currentBalance : (form.openingBalance || 0),
        status: 'active',
        createdAt: editItem?.createdAt || new Date().toISOString(),
      };
      financialDb.saveBankAccount(bankAccount);
    }

    showToast('success', editItem ? 'حساب ویرایش شد' : 'حساب ایجاد شد');
    setShowForm(false);
    setEditItem(null);
    loadData();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">صندوق و بانک</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت حساب‌های نقدی و بانکی</p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <Plus size={18} />
          حساب جدید
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-gradient-teal p-6 text-white rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Wallet size={28} />
            <span className="text-sm">مجموع صندوق‌ها</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalCash, currency)}</p>
          <p className="text-xs mt-2 opacity-80">{cashAccounts.length} حساب</p>
        </div>
        <div className="card-gradient-purple p-6 text-white rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard size={28} />
            <span className="text-sm">مجموع بانک‌ها</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalBank, currency)}</p>
          <p className="text-xs mt-2 opacity-80">{bankAccounts.length} حساب</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 p-2">
          <button 
            onClick={() => setActiveTab('cash')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'cash' 
                ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            صندوق‌ها ({cashAccounts.length})
          </button>
          <button 
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'bank' 
                ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            حساب‌های بانکی ({bankAccounts.length})
          </button>
        </div>

        <div className="p-5">
          {/* Cash Accounts */}
          {activeTab === 'cash' && (
            <div className="space-y-3">
              {cashAccounts.map(cash => (
                <div key={cash.id} className="card p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                          <Wallet size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">{cash.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">کد: {cash.code}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">موجودی اولیه</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {formatCurrency(cash.openingBalance, currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">موجودی فعلی</p>
                          <p className="text-lg font-bold text-teal-600">
                            {formatCurrency(cash.currentBalance, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cash)}>
                      <Edit size={16} className="text-blue-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {cashAccounts.length === 0 && (
                <div className="text-center py-12">
                  <Wallet size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-slate-500 dark:text-slate-400">صندوقی ثبت نشده</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">اولین صندوق خود را ایجاد کنید</p>
                </div>
              )}
            </div>
          )}

          {/* Bank Accounts */}
          {activeTab === 'bank' && (
            <div className="space-y-3">
              {bankAccounts.map(bank => (
                <div key={bank.id} className="card p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                          <CreditCard size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">{bank.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{bank.bankName}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">شماره حساب</p>
                          <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                            {bank.accountNumber || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">موجودی فعلی</p>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(bank.currentBalance, currency)}
                          </p>
                        </div>
                      </div>
                      {bank.cardNumber && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400">شماره کارت</p>
                          <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                            {bank.cardNumber.slice(0, 4)} **** **** {bank.cardNumber.slice(-4)}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(bank)}>
                      <Edit size={16} className="text-blue-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {bankAccounts.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-slate-500 dark:text-slate-400">حساب بانکی ثبت نشده</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">اولین حساب بانکی خود را ایجاد کنید</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editItem ? 'ویرایش حساب' : 'حساب جدید'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Input
                label="نام حساب"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={activeTab === 'cash' ? 'مثال: صندوق اصلی' : 'مثال: بانک ملت'}
              />

              {activeTab === 'bank' && (
                <>
                  <Input
                    label="نام بانک"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    placeholder="مثال: ملت، ملی، پاسارگاد"
                  />
                  <Input
                    label="شماره حساب"
                    value={form.accountNumber}
                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="شماره حساب بانکی"
                  />
                  <Input
                    label="شماره کارت"
                    value={form.cardNumber}
                    onChange={e => setForm({ ...form, cardNumber: e.target.value })}
                    placeholder="شماره کارت 16 رقمی"
                  />
                  <Input
                    label="شبا (IBAN)"
                    value={form.iban}
                    onChange={e => setForm({ ...form, iban: e.target.value })}
                    placeholder="IR..."
                  />
                </>
              )}

              <Input
                label="موجودی اولیه"
                type="number"
                value={form.openingBalance}
                onChange={e => setForm({ ...form, openingBalance: Number(e.target.value) })}
                placeholder="0"
                disabled={!!editItem}
              />

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditItem(null); }}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={save}>
                  {editItem ? 'ذخیره تغییرات' : 'ایجاد حساب'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

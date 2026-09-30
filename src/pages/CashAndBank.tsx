import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { financialDb, type CashAccount, type BankAccount } from '../lib/financialDb';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, X, Wallet, CreditCard } from 'lucide-react';

export default function CashAndBank() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'cash' | 'bank'>('cash');
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CashAccount | BankAccount | null>(null);

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

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">صندوق و بانک</h2>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
          <Plus size={16} /> حساب جدید
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('cash')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'cash' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          صندوق‌ها ({cashAccounts.length})
        </button>
        <button onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'bank' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          حساب‌های بانکی ({bankAccounts.length})
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} />
            <span className="text-sm">مجموع صندوق‌ها</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalCash, currency)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={20} />
            <span className="text-sm">مجموع بانک‌ها</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalBank, currency)}</p>
        </div>
      </div>

      {/* Cash Accounts */}
      {activeTab === 'cash' && (
        <div className="space-y-2">
          {cashAccounts.map(cash => (
            <div key={cash.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{cash.name}</p>
                  <p className="text-xs text-slate-500 mt-1">کد: {cash.code}</p>
                  <p className="text-xs text-slate-500">موجودی اولیه: {formatCurrency(cash.openingBalance, currency)}</p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(cash.currentBalance, currency)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${cash.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {cash.status === 'active' ? 'فعال' : 'بسته'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {cashAccounts.length === 0 && <p className="text-center text-slate-500 py-8">صندوقی ثبت نشده</p>}
        </div>
      )}

      {/* Bank Accounts */}
      {activeTab === 'bank' && (
        <div className="space-y-2">
          {bankAccounts.map(bank => (
            <div key={bank.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{bank.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{bank.bankName}</p>
                  <p className="text-xs text-slate-500">شماره حساب: {bank.accountNumber}</p>
                  {bank.cardNumber && <p className="text-xs text-slate-500">کارت: {bank.cardNumber.slice(0, 4)} **** **** {bank.cardNumber.slice(-4)}</p>}
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(bank.currentBalance, currency)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${bank.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {bank.status === 'active' ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {bankAccounts.length === 0 && <p className="text-center text-slate-500 py-8">حساب بانکی ثبت نشده</p>}
        </div>
      )}
    </div>
  );
}

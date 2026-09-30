import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { financialDb, type Expense, type IncomeTransaction } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, X, TrendingDown, TrendingUp } from 'lucide-react';

const expenseCategories = [
  'اجاره', 'آب', 'برق', 'گاز', 'اینترنت', 'تلفن', 'حقوق', 'تبلیغات',
  'حمل‌ونقل', 'تعمیرات فروشگاه', 'ابزار تعمیرات', 'خرید تجهیزات',
  'ملزومات', 'بسته‌بندی', 'کارمزد بانک', 'کارمزد کارتخوان', 'مالیات', 'بیمه', 'سایر'
];

const incomeCategories = [
  'خدمات', 'اجرت تعمیرات', 'نصب گلس', 'نرم‌افزار', 'انتقال اطلاعات', 'درآمد متفرقه'
];

export default function ExpensesAndIncome() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    description: '',
    paidFrom: 'cash',
    paidFromId: '',
    accountId: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setExpenses(financialDb.getExpenses().reverse());
    setIncomes(financialDb.getIncomeTransactions().reverse());
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

  const cashAccounts = financialDb.getCashAccounts();
  const bankAccounts = financialDb.getBankAccounts();

  const saveExpense = () => {
    if (!form.amount || form.amount <= 0) { showToast('error', 'مبلغ الزامی است'); return; }
    if (!form.category) { showToast('error', 'دسته‌بندی الزامی است'); return; }

    const expense: Expense = {
      id: uuidv4(),
      date: form.date,
      amount: form.amount,
      category: form.category,
      description: form.description,
      paidFrom: form.paidFrom,
      paidFromId: form.paidFromId,
      accountId: form.accountId,
      recurring: false,
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    financialDb.saveExpense(expense);

    // Create accounting entry
    const cashAccountCode = form.paidFrom === 'cash' ? '1110' : '1210';
    const expenseAccountCode = getExpenseAccountCode(form.category);
    
    AccountingService.recordExpense(
      expense.id,
      expense.amount,
      expenseAccountCode,
      cashAccountCode,
      user?.id || '',
      user?.fullName || ''
    );

    // Update cash/bank balance
    if (form.paidFrom === 'cash') {
      const cashAccount = cashAccounts.find(c => c.id === form.paidFromId);
      if (cashAccount) {
        cashAccount.currentBalance -= expense.amount;
        financialDb.saveCashAccount(cashAccount);
      }
    } else {
      const bankAccount = bankAccounts.find(b => b.id === form.paidFromId);
      if (bankAccount) {
        bankAccount.currentBalance -= expense.amount;
        financialDb.saveBankAccount(bankAccount);
      }
    }

    showToast('success', 'هزینه ثبت شد');
    setShowForm(false);
    setForm({ date: new Date().toISOString().split('T')[0], amount: 0, category: '', description: '', paidFrom: 'cash', paidFromId: '', accountId: '' });
    loadData();
  };

  const saveIncome = () => {
    if (!form.amount || form.amount <= 0) { showToast('error', 'مبلغ الزامی است'); return; }
    if (!form.category) { showToast('error', 'دسته‌بندی الزامی است'); return; }

    const income: IncomeTransaction = {
      id: uuidv4(),
      date: form.date,
      amount: form.amount,
      category: form.category,
      description: form.description,
      receivedIn: form.paidFrom,
      receivedInId: form.paidFromId,
      accountId: form.accountId,
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    financialDb.saveIncomeTransaction(income);

    // Update cash/bank balance
    if (form.paidFrom === 'cash') {
      const cashAccount = cashAccounts.find(c => c.id === form.paidFromId);
      if (cashAccount) {
        cashAccount.currentBalance += income.amount;
        financialDb.saveCashAccount(cashAccount);
      }
    } else {
      const bankAccount = bankAccounts.find(b => b.id === form.paidFromId);
      if (bankAccount) {
        bankAccount.currentBalance += income.amount;
        financialDb.saveBankAccount(bankAccount);
      }
    }

    showToast('success', 'درآمد ثبت شد');
    setShowForm(false);
    setForm({ date: new Date().toISOString().split('T')[0], amount: 0, category: '', description: '', paidFrom: 'cash', paidFromId: '', accountId: '' });
    loadData();
  };

  const getExpenseAccountCode = (category: string): string => {
    const map: Record<string, string> = {
      'اجاره': '5200',
      'حقوق': '5300',
      'آب': '5400',
      'برق': '5400',
      'گاز': '5400',
      'اینترنت': '5500',
      'تلفن': '5500',
      'تبلیغات': '5600',
      'حمل‌ونقل': '5700',
      'تعمیرات فروشگاه': '5800',
      'کارمزد بانک': '5900',
      'کارمزد کارتخوان': '5900',
    };
    return map[category] || '5990';
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">هزینه‌ها و درآمدها</h2>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
          <Plus size={16} /> ثبت جدید
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'expenses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          هزینه‌ها ({expenses.length})
        </button>
        <button onClick={() => setActiveTab('income')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'income' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          درآمدها ({incomes.length})
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={20} />
            <span className="text-sm">مجموع هزینه‌ها</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm">مجموع درآمدها</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalIncome, currency)}</p>
        </div>
      </div>

      {/* Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-2">
          {expenses.map(expense => (
            <div key={expense.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{expense.category}</p>
                  <p className="text-xs text-slate-500 mt-1">{expense.description}</p>
                  <p className="text-xs text-slate-400">{toJalali(expense.date)}</p>
                </div>
                <p className="text-lg font-bold text-red-600">{formatCurrency(expense.amount, currency)}</p>
              </div>
            </div>
          ))}
          {expenses.length === 0 && <p className="text-center text-slate-500 py-8">هزینه‌ای ثبت نشده</p>}
        </div>
      )}

      {/* Income List */}
      {activeTab === 'income' && (
        <div className="space-y-2">
          {incomes.map(income => (
            <div key={income.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{income.category}</p>
                  <p className="text-xs text-slate-500 mt-1">{income.description}</p>
                  <p className="text-xs text-slate-400">{toJalali(income.date)}</p>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(income.amount, currency)}</p>
              </div>
            </div>
          ))}
          {incomes.length === 0 && <p className="text-center text-slate-500 py-8">درآمدی ثبت نشده</p>}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">ثبت {activeTab === 'expenses' ? 'هزینه' : 'درآمد'}</h3>
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
              <label className="text-xs text-slate-500">دسته‌بندی</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="">انتخاب کنید</option>
                {(activeTab === 'expenses' ? expenseCategories : incomeCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">توضیحات</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>

            <div>
              <label className="text-xs text-slate-500">پرداخت از / دریافت به</label>
              <select value={form.paidFrom} onChange={e => setForm({ ...form, paidFrom: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="cash">صندوق</option>
                <option value="bank">بانک</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">انتخاب حساب</label>
              <select value={form.paidFromId} onChange={e => setForm({ ...form, paidFromId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="">انتخاب کنید</option>
                {form.paidFrom === 'cash' ? (
                  cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                ) : (
                  bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                )}
              </select>
            </div>

            <button onClick={activeTab === 'expenses' ? saveExpense : saveIncome}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
              ثبت
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

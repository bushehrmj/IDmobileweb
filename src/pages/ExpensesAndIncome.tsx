import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { financialDb, type Expense, type IncomeTransaction } from '../lib/financialDb';
import { AccountingService } from '../lib/accounting';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, X, TrendingDown, TrendingUp, Filter, Calendar,
  Receipt, DollarSign
} from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  const cashAccounts = financialDb.getCashAccounts();
  const bankAccounts = financialDb.getBankAccounts();

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.description.includes(search) || e.category.includes(search);
    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const date = new Date(e.date);
    const matchDateFrom = !dateFrom || date >= new Date(dateFrom);
    const matchDateTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchCategory && matchDateFrom && matchDateTo;
  });

  const filteredIncomes = incomes.filter(i => {
    const matchSearch = i.description.includes(search) || i.category.includes(search);
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter;
    const date = new Date(i.date);
    const matchDateFrom = !dateFrom || date >= new Date(dateFrom);
    const matchDateTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchCategory && matchDateFrom && matchDateTo;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);

  const settings = JSON.parse(localStorage.getItem('idmobile_settings') || '{}');
  const currency = settings.currency || 'تومان';

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
    resetForm();
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
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: '',
      description: '',
      paidFrom: 'cash',
      paidFromId: '',
      accountId: '',
    });
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
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">هزینه‌ها و درآمدها</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت هزینه‌های عملیاتی و درآمدهای متفرقه</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          ثبت جدید
        </Button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 p-2">
          <button 
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'expenses' 
                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            هزینه‌ها ({expenses.length})
          </button>
          <button 
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'income' 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            درآمدها ({incomes.length})
          </button>
        </div>

        <div className="p-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={20} />
                <span className="text-sm">مجموع هزینه‌ها</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} />
                <span className="text-sm">مجموع درآمدها</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalIncome, currency)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={20} className="text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">فیلتر</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="جستجو..." 
                  className="input" 
                />
              </div>
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="input"
              >
                <option value="all">همه دسته‌ها</option>
                {(activeTab === 'expenses' ? expenseCategories : incomeCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)}
                className="input" 
              />
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            {(activeTab === 'expenses' ? filteredExpenses : filteredIncomes).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeTab === 'expenses' ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    {activeTab === 'expenses' ? (
                      <TrendingDown size={20} className="text-white" />
                    ) : (
                      <TrendingUp size={20} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{toJalali(item.date)}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${
                  activeTab === 'expenses' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(item.amount, currency)}
                </p>
              </div>
            ))}
            {(activeTab === 'expenses' ? filteredExpenses : filteredIncomes).length === 0 && (
              <div className="text-center py-12">
                <Receipt size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                  {activeTab === 'expenses' ? 'هزینه‌ای ثبت نشده' : 'درآمدی ثبت نشده'}
                </p>
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                ثبت {activeTab === 'expenses' ? 'هزینه' : 'درآمد'}
              </h3>
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
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">دسته‌بندی</label>
                <select 
                  value={form.category} 
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="input"
                >
                  <option value="">انتخاب کنید</option>
                  {(activeTab === 'expenses' ? expenseCategories : incomeCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <Input
                label="توضیحات"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="توضیحات اضافی..."
              />

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {activeTab === 'expenses' ? 'پرداخت از' : 'دریافت به'}
                </label>
                <select 
                  value={form.paidFrom} 
                  onChange={e => setForm({ ...form, paidFrom: e.target.value })}
                  className="input"
                >
                  <option value="cash">صندوق</option>
                  <option value="bank">بانک</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">انتخاب حساب</label>
                <select 
                  value={form.paidFromId} 
                  onChange={e => setForm({ ...form, paidFromId: e.target.value })}
                  className="input"
                >
                  <option value="">انتخاب کنید</option>
                  {form.paidFrom === 'cash' ? (
                    cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  ) : (
                    bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>
                  انصراف
                </Button>
                <Button 
                  variant={activeTab === 'expenses' ? 'danger' : 'success'} 
                  className="flex-1" 
                  onClick={activeTab === 'expenses' ? saveExpense : saveIncome}
                >
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

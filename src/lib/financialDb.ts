// Financial Database Layer - Double Entry Accounting System
import { v4 as uuidv4 } from 'uuid';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parentId?: string;
  isSystem: boolean;
  balance: number;
  active: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType: 'sale' | 'purchase' | 'repair' | 'expense' | 'payment' | 'receipt' | 'transfer' | 'manual' | 'adjustment' | 'opening' | 'closing';
  referenceId: string;
  lines: JournalEntryLine[];
  status: 'draft' | 'posted' | 'voided';
  createdBy: string;
  createdAt: string;
  postedAt?: string;
  voidedAt?: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface CashAccount {
  id: string;
  name: string;
  code: string;
  accountId: string;
  openingBalance: number;
  currentBalance: number;
  responsibleUserId: string;
  status: 'active' | 'closed';
  closedAt?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  cardNumber: string;
  iban: string;
  accountId: string;
  openingBalance: number;
  currentBalance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface POSTerminal {
  id: string;
  name: string;
  bankName: string;
  terminalId: string;
  targetBankAccountId: string;
  commissionRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface POSTransaction {
  id: string;
  terminalId: string;
  amount: number;
  date: string;
  time: string;
  trackingNumber: string;
  saleId?: string;
  status: 'pending' | 'settled' | 'failed' | 'refunded';
  settledAt?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  paidFrom: 'cash' | 'bank' | 'pos';
  paidFromId: string;
  accountId: string;
  vendor?: string;
  attachment?: string;
  recurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdBy: string;
  createdAt: string;
}

export interface IncomeTransaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  receivedIn: 'cash' | 'bank' | 'pos';
  receivedInId: string;
  accountId: string;
  customer?: string;
  createdBy: string;
  createdAt: string;
}

export interface Check {
  id: string;
  type: 'received' | 'paid';
  number: string;
  bankName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  partyName: string;
  description: string;
  status: 'pending' | 'deposited' | 'cleared' | 'bounced' | 'transferred' | 'voided';
  relatedAccountId?: string;
  saleId?: string;
  purchaseId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  date: string;
  amount: number;
  fromType: 'cash' | 'bank';
  fromId: string;
  toType: 'cash' | 'bank';
  toId: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  year: number;
  month: number;
  accountId: string;
  accountName: string;
  budgetAmount: number;
  actualAmount: number;
  createdAt: string;
}

export interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
}

export interface FinancialAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  date: string;
}

// Default Chart of Accounts
export function getDefaultAccounts(): Account[] {
  const now = new Date().toISOString();
  return [
    // Assets
    { id: uuidv4(), code: '1000', name: 'دارایی‌ها', type: 'asset', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '1100', name: 'صندوق‌ها', type: 'asset', parentId: '1000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '1110', name: 'صندوق اصلی', type: 'asset', parentId: '1100', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '1120', name: 'تنخواه', type: 'asset', parentId: '1100', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '1200', name: 'بانک‌ها', type: 'asset', parentId: '1000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '1300', name: 'حساب‌های دریافتنی', type: 'asset', parentId: '1000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '1400', name: 'موجودی کالا', type: 'asset', parentId: '1000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '1500', name: 'تجهیزات', type: 'asset', parentId: '1000', isSystem: true, balance: 0, active: true, createdAt: now },
    // Liabilities
    { id: uuidv4(), code: '2000', name: 'بدهی‌ها', type: 'liability', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '2100', name: 'حساب‌های پرداختنی', type: 'liability', parentId: '2000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '2200', name: 'چک‌های پرداختنی', type: 'liability', parentId: '2000', isSystem: true, balance: 0, active: true, createdAt: now },
    // Equity
    { id: uuidv4(), code: '3000', name: 'سرمایه', type: 'equity', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '3100', name: 'سود انباشته', type: 'equity', isSystem: true, balance: 0, active: true, createdAt: now },
    // Income
    { id: uuidv4(), code: '4000', name: 'درآمدها', type: 'income', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '4100', name: 'فروش کالا', type: 'income', parentId: '4000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '4200', name: 'درآمد تعمیرات', type: 'income', parentId: '4000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '4300', name: 'درآمد خدمات', type: 'income', parentId: '4000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '4400', name: 'سایر درآمدها', type: 'income', parentId: '4000', isSystem: true, balance: 0, active: true, createdAt: now },
    // Expenses
    { id: uuidv4(), code: '5000', name: 'هزینه‌ها', type: 'expense', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5100', name: 'بهای تمام‌شده کالا', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5200', name: 'اجاره', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5300', name: 'حقوق', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5400', name: 'آب و برق', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5500', name: 'اینترنت و تلفن', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5600', name: 'تبلیغات', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5700', name: 'حمل‌ونقل', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5800', name: 'تعمیر و نگهداری', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5900', name: 'کارمزد بانکی', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
    { id: uuidv4(), code: '5990', name: 'سایر هزینه‌ها', type: 'expense', parentId: '5000', isSystem: true, balance: 0, active: true, createdAt: now },
  ];
}

const DB_PREFIX = 'idmobile_fin_';

function getCollection<T>(name: string): T[] {
  try {
    const data = localStorage.getItem(DB_PREFIX + name);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setCollection<T>(name: string, data: T[]): void {
  localStorage.setItem(DB_PREFIX + name, JSON.stringify(data));
}

export function initializeFinancialDB(): void {
  const initialized = localStorage.getItem(DB_PREFIX + 'initialized');
  if (initialized) return;

  setCollection('accounts', getDefaultAccounts());
  setCollection('journal_entries', []);
  setCollection('cash_accounts', []);
  setCollection('bank_accounts', []);
  setCollection('pos_terminals', []);
  setCollection('pos_transactions', []);
  setCollection('expenses', []);
  setCollection('income_transactions', []);
  setCollection('checks', []);
  setCollection('transfers', []);
  setCollection('budgets', []);
  setCollection('accounting_periods', []);
  setCollection('financial_audit_logs', []);

  localStorage.setItem(DB_PREFIX + 'initialized', 'true');
}

export const financialDb = {
  // Accounts
  getAccounts: (): Account[] => getCollection<Account>('accounts'),
  getAccount: (id: string): Account | undefined => getCollection<Account>('accounts').find(a => a.id === id),
  getAccountByCode: (code: string): Account | undefined => getCollection<Account>('accounts').find(a => a.code === code),
  saveAccount: (account: Account): void => {
    const accounts = getCollection<Account>('accounts');
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) accounts[idx] = account; else accounts.push(account);
    setCollection('accounts', accounts);
  },

  // Journal Entries
  getJournalEntries: (): JournalEntry[] => getCollection<JournalEntry>('journal_entries'),
  getJournalEntry: (id: string): JournalEntry | undefined => getCollection<JournalEntry>('journal_entries').find(e => e.id === id),
  saveJournalEntry: (entry: JournalEntry): void => {
    const entries = getCollection<JournalEntry>('journal_entries');
    const idx = entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) entries[idx] = entry; else entries.push(entry);
    setCollection('journal_entries', entries);
  },

  // Cash Accounts
  getCashAccounts: (): CashAccount[] => getCollection<CashAccount>('cash_accounts'),
  getCashAccount: (id: string): CashAccount | undefined => getCollection<CashAccount>('cash_accounts').find(c => c.id === id),
  saveCashAccount: (account: CashAccount): void => {
    const accounts = getCollection<CashAccount>('cash_accounts');
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) accounts[idx] = account; else accounts.push(account);
    setCollection('cash_accounts', accounts);
  },

  // Bank Accounts
  getBankAccounts: (): BankAccount[] => getCollection<BankAccount>('bank_accounts'),
  getBankAccount: (id: string): BankAccount | undefined => getCollection<BankAccount>('bank_accounts').find(b => b.id === id),
  saveBankAccount: (account: BankAccount): void => {
    const accounts = getCollection<BankAccount>('bank_accounts');
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) accounts[idx] = account; else accounts.push(account);
    setCollection('bank_accounts', accounts);
  },

  // POS Terminals
  getPOSTerminals: (): POSTerminal[] => getCollection<POSTerminal>('pos_terminals'),
  savePOSTerminal: (terminal: POSTerminal): void => {
    const terminals = getCollection<POSTerminal>('pos_terminals');
    const idx = terminals.findIndex(t => t.id === terminal.id);
    if (idx >= 0) terminals[idx] = terminal; else terminals.push(terminal);
    setCollection('pos_terminals', terminals);
  },

  // POS Transactions
  getPOSTransactions: (): POSTransaction[] => getCollection<POSTransaction>('pos_transactions'),
  savePOSTransaction: (transaction: POSTransaction): void => {
    const transactions = getCollection<POSTransaction>('pos_transactions');
    transactions.push(transaction);
    setCollection('pos_transactions', transactions);
  },

  // Expenses
  getExpenses: (): Expense[] => getCollection<Expense>('expenses'),
  saveExpense: (expense: Expense): void => {
    const expenses = getCollection<Expense>('expenses');
    expenses.push(expense);
    setCollection('expenses', expenses);
  },

  // Income Transactions
  getIncomeTransactions: (): IncomeTransaction[] => getCollection<IncomeTransaction>('income_transactions'),
  saveIncomeTransaction: (income: IncomeTransaction): void => {
    const incomes = getCollection<IncomeTransaction>('income_transactions');
    incomes.push(income);
    setCollection('income_transactions', incomes);
  },

  // Checks
  getChecks: (): Check[] => getCollection<Check>('checks'),
  saveCheck: (check: Check): void => {
    const checks = getCollection<Check>('checks');
    const idx = checks.findIndex(c => c.id === check.id);
    if (idx >= 0) checks[idx] = check; else checks.push(check);
    setCollection('checks', checks);
  },

  // Transfers
  getTransfers: (): Transfer[] => getCollection<Transfer>('transfers'),
  saveTransfer: (transfer: Transfer): void => {
    const transfers = getCollection<Transfer>('transfers');
    transfers.push(transfer);
    setCollection('transfers', transfers);
  },

  // Budgets
  getBudgets: (): Budget[] => getCollection<Budget>('budgets'),
  saveBudget: (budget: Budget): void => {
    const budgets = getCollection<Budget>('budgets');
    const idx = budgets.findIndex(b => b.id === budget.id);
    if (idx >= 0) budgets[idx] = budget; else budgets.push(budget);
    setCollection('budgets', budgets);
  },

  // Accounting Periods
  getAccountingPeriods: (): AccountingPeriod[] => getCollection<AccountingPeriod>('accounting_periods'),
  saveAccountingPeriod: (period: AccountingPeriod): void => {
    const periods = getCollection<AccountingPeriod>('accounting_periods');
    const idx = periods.findIndex(p => p.id === period.id);
    if (idx >= 0) periods[idx] = period; else periods.push(period);
    setCollection('accounting_periods', periods);
  },

  // Financial Audit Logs
  getFinancialAuditLogs: (): FinancialAuditLog[] => getCollection<FinancialAuditLog>('financial_audit_logs'),
  addFinancialAuditLog: (log: FinancialAuditLog): void => {
    const logs = getCollection<FinancialAuditLog>('financial_audit_logs');
    logs.unshift(log);
    if (logs.length > 5000) logs.length = 5000;
    setCollection('financial_audit_logs', logs);
  },

  // Generate Entry Number
  getNextEntryNumber: (): string => {
    const entries = getCollection<JournalEntry>('journal_entries');
    const year = new Date().getFullYear();
    const count = entries.length + 1;
    return `JV-${year}-${String(count).padStart(6, '0')}`;
  },

  // Export All Financial Data
  exportAllFinancial: (): string => {
    const data: Record<string, unknown> = {};
    const keys = ['accounts', 'journal_entries', 'cash_accounts', 'bank_accounts', 'pos_terminals', 'pos_transactions', 'expenses', 'income_transactions', 'checks', 'transfers', 'budgets', 'accounting_periods', 'financial_audit_logs'];
    keys.forEach(key => {
      data[key] = localStorage.getItem(DB_PREFIX + key);
    });
    return JSON.stringify(data, null, 2);
  },

  // Import All Financial Data
  importAllFinancial: (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      const keys = ['accounts', 'journal_entries', 'cash_accounts', 'bank_accounts', 'pos_terminals', 'pos_transactions', 'expenses', 'income_transactions', 'checks', 'transfers', 'budgets', 'accounting_periods', 'financial_audit_logs'];
      keys.forEach(key => {
        if (data[key]) localStorage.setItem(DB_PREFIX + key, data[key]);
      });
      return true;
    } catch { return false; }
  },
};

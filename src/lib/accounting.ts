// Accounting Service - Double Entry Bookkeeping
import { v4 as uuidv4 } from 'uuid';
import { financialDb, type JournalEntry, type JournalEntryLine } from './financialDb';
import { db } from './db';

export interface AccountingTransaction {
  description: string;
  referenceType: JournalEntry['referenceType'];
  referenceId: string;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
  userId: string;
  userName: string;
}

export class AccountingService {
  // Create and post a journal entry
  static createEntry(transaction: AccountingTransaction): JournalEntry | null {
    // Validate: Total Debit = Total Credit
    const totalDebit = transaction.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = transaction.lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.error('Journal entry is not balanced:', { totalDebit, totalCredit });
      return null;
    }

    const entry: JournalEntry = {
      id: uuidv4(),
      entryNumber: financialDb.getNextEntryNumber(),
      date: new Date().toISOString(),
      description: transaction.description,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      lines: transaction.lines.map(line => {
        const account = financialDb.getAccountByCode(line.accountCode);
        return {
          id: uuidv4(),
          accountId: account?.id || '',
          accountCode: line.accountCode,
          accountName: account?.name || '',
          debit: line.debit,
          credit: line.credit,
          description: line.description || transaction.description,
        };
      }),
      status: 'posted',
      createdBy: transaction.userId,
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
    };

    financialDb.saveJournalEntry(entry);

    // Update account balances
    transaction.lines.forEach(line => {
      const account = financialDb.getAccountByCode(line.accountCode);
      if (account) {
        // Assets & Expenses: Debit increases, Credit decreases
        // Liabilities, Equity & Income: Credit increases, Debit decreases
        if (account.type === 'asset' || account.type === 'expense') {
          account.balance += line.debit - line.credit;
        } else {
          account.balance += line.credit - line.debit;
        }
        financialDb.saveAccount(account);
      }
    });

    // Audit log
    financialDb.addFinancialAuditLog({
      id: uuidv4(),
      userId: transaction.userId,
      userName: transaction.userName,
      action: 'create_journal_entry',
      entityType: 'journal_entry',
      entityId: entry.id,
      newValue: `Entry ${entry.entryNumber}: ${transaction.description}`,
      date: new Date().toISOString(),
    });

    return entry;
  }

  // Record a cash sale
  static recordCashSale(saleId: string, amount: number, cogs: number, cashAccountCode: string, userId: string, userName: string): JournalEntry | null {
    // Sale Entry: Debit Cash, Credit Sales Revenue
    const saleEntry = this.createEntry({
      description: `فروش نقدی - فاکتور ${saleId}`,
      referenceType: 'sale',
      referenceId: saleId,
      lines: [
        { accountCode: cashAccountCode, debit: amount, credit: 0, description: 'دریافت نقدی' },
        { accountCode: '4100', debit: 0, credit: amount, description: 'فروش کالا' },
      ],
      userId,
      userName,
    });

    // COGS Entry: Debit COGS, Credit Inventory
    if (cogs > 0) {
      this.createEntry({
        description: `بهای تمام‌شده - فاکتور ${saleId}`,
        referenceType: 'sale',
        referenceId: saleId,
        lines: [
          { accountCode: '5100', debit: cogs, credit: 0, description: 'بهای تمام‌شده کالا' },
          { accountCode: '1400', debit: 0, credit: cogs, description: 'کاهش موجودی' },
        ],
        userId,
        userName,
      });
    }

    return saleEntry;
  }

  // Record a credit sale
  static recordCreditSale(saleId: string, amount: number, cogs: number, userId: string, userName: string): JournalEntry | null {
    // Sale Entry: Debit Accounts Receivable, Credit Sales Revenue
    const saleEntry = this.createEntry({
      description: `فروش نسیه - فاکتور ${saleId}`,
      referenceType: 'sale',
      referenceId: saleId,
      lines: [
        { accountCode: '1300', debit: amount, credit: 0, description: 'حساب دریافتنی' },
        { accountCode: '4100', debit: 0, credit: amount, description: 'فروش کالا' },
      ],
      userId,
      userName,
    });

    // COGS Entry
    if (cogs > 0) {
      this.createEntry({
        description: `بهای تمام‌شده - فاکتور ${saleId}`,
        referenceType: 'sale',
        referenceId: saleId,
        lines: [
          { accountCode: '5100', debit: cogs, credit: 0, description: 'بهای تمام‌شده' },
          { accountCode: '1400', debit: 0, credit: cogs, description: 'کاهش موجودی' },
        ],
        userId,
        userName,
      });
    }

    return saleEntry;
  }

  // Record customer payment
  static recordCustomerPayment(paymentId: string, amount: number, cashAccountCode: string, userId: string, userName: string): JournalEntry | null {
    return this.createEntry({
      description: `دریافت از مشتری - ${paymentId}`,
      referenceType: 'receipt',
      referenceId: paymentId,
      lines: [
        { accountCode: cashAccountCode, debit: amount, credit: 0, description: 'دریافت نقدی' },
        { accountCode: '1300', debit: 0, credit: amount, description: 'کاهش حساب دریافتنی' },
      ],
      userId,
      userName,
    });
  }

  // Record cash purchase
  static recordCashPurchase(purchaseId: string, amount: number, cashAccountCode: string, userId: string, userName: string): JournalEntry | null {
    return this.createEntry({
      description: `خرید نقدی - ${purchaseId}`,
      referenceType: 'purchase',
      referenceId: purchaseId,
      lines: [
        { accountCode: '1400', debit: amount, credit: 0, description: 'افزایش موجودی' },
        { accountCode: cashAccountCode, debit: 0, credit: amount, description: 'پرداخت نقدی' },
      ],
      userId,
      userName,
    });
  }

  // Record credit purchase
  static recordCreditPurchase(purchaseId: string, amount: number, userId: string, userName: string): JournalEntry | null {
    return this.createEntry({
      description: `خرید نسیه - ${purchaseId}`,
      referenceType: 'purchase',
      referenceId: purchaseId,
      lines: [
        { accountCode: '1400', debit: amount, credit: 0, description: 'افزایش موجودی' },
        { accountCode: '2100', debit: 0, credit: amount, description: 'حساب پرداختنی' },
      ],
      userId,
      userName,
    });
  }

  // Record supplier payment
  static recordSupplierPayment(paymentId: string, amount: number, cashAccountCode: string, userId: string, userName: string): JournalEntry | null {
    return this.createEntry({
      description: `پرداخت به تأمین‌کننده - ${paymentId}`,
      referenceType: 'payment',
      referenceId: paymentId,
      lines: [
        { accountCode: '2100', debit: amount, credit: 0, description: 'کاهش حساب پرداختنی' },
        { accountCode: cashAccountCode, debit: 0, credit: amount, description: 'پرداخت نقدی' },
      ],
      userId,
      userName,
    });
  }

  // Record expense
  static recordExpense(expenseId: string, amount: number, expenseAccountCode: string, cashAccountCode: string, userId: string, userName: string): JournalEntry | null {
    return this.createEntry({
      description: `ثبت هزینه - ${expenseId}`,
      referenceType: 'expense',
      referenceId: expenseId,
      lines: [
        { accountCode: expenseAccountCode, debit: amount, credit: 0, description: 'هزینه' },
        { accountCode: cashAccountCode, debit: 0, credit: amount, description: 'پرداخت' },
      ],
      userId,
      userName,
    });
  }

  // Record repair income
  static recordRepairIncome(repairId: string, amount: number, partsCost: number, cashAccountCode: string, userId: string, userName: string): JournalEntry | null {
    // Income Entry
    this.createEntry({
      description: `درآمد تعمیر - ${repairId}`,
      referenceType: 'repair',
      referenceId: repairId,
      lines: [
        { accountCode: cashAccountCode, debit: amount, credit: 0, description: 'دریافت' },
        { accountCode: '4200', debit: 0, credit: amount, description: 'درآمد تعمیرات' },
      ],
      userId,
      userName,
    });

    // Parts COGS
    if (partsCost > 0) {
      this.createEntry({
        description: `هزینه قطعات تعمیر - ${repairId}`,
        referenceType: 'repair',
        referenceId: repairId,
        lines: [
          { accountCode: '5100', debit: partsCost, credit: 0, description: 'بهای قطعات' },
          { accountCode: '1400', debit: 0, credit: partsCost, description: 'کاهش موجودی قطعات' },
        ],
        userId,
        userName,
      });
    }

    return null;
  }

  // Record transfer between accounts
  static recordTransfer(transferId: string, amount: number, fromAccountCode: string, toAccountCode: string, userId: string, userName: string): JournalEntry | null {
    return this.createEntry({
      description: `انتقال بین حساب‌ها - ${transferId}`,
      referenceType: 'transfer',
      referenceId: transferId,
      lines: [
        { accountCode: toAccountCode, debit: amount, credit: 0, description: 'واریز' },
        { accountCode: fromAccountCode, debit: 0, credit: amount, description: 'برداشت' },
      ],
      userId,
      userName,
    });
  }

  // Void a journal entry
  static voidEntry(entryId: string, userId: string, userName: string): boolean {
    const entry = financialDb.getJournalEntry(entryId);
    if (!entry || entry.status === 'voided') return false;

    // Create reverse entry
    const reverseLines = entry.lines.map(line => ({
      accountCode: line.accountCode,
      debit: line.credit,
      credit: line.debit,
      description: `برگشت: ${line.description}`,
    }));

    this.createEntry({
      description: `برگشت سند ${entry.entryNumber}`,
      referenceType: 'adjustment',
      referenceId: entryId,
      lines: reverseLines,
      userId,
      userName,
    });

    // Mark original as voided
    entry.status = 'voided';
    entry.voidedAt = new Date().toISOString();
    financialDb.saveJournalEntry(entry);

    return true;
  }

  // Get account balance
  static getAccountBalance(accountCode: string): number {
    const account = financialDb.getAccountByCode(accountCode);
    return account?.balance || 0;
  }

  // Get total assets
  static getTotalAssets(): number {
    return financialDb.getAccounts()
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + a.balance, 0);
  }

  // Get total liabilities
  static getTotalLiabilities(): number {
    return financialDb.getAccounts()
      .filter(a => a.type === 'liability')
      .reduce((sum, a) => sum + a.balance, 0);
  }

  // Get total equity
  static getTotalEquity(): number {
    return financialDb.getAccounts()
      .filter(a => a.type === 'equity')
      .reduce((sum, a) => sum + a.balance, 0);
  }

  // Get total income
  static getTotalIncome(): number {
    return financialDb.getAccounts()
      .filter(a => a.type === 'income')
      .reduce((sum, a) => sum + a.balance, 0);
  }

  // Get total expenses
  static getTotalExpenses(): number {
    return financialDb.getAccounts()
      .filter(a => a.type === 'expense')
      .reduce((sum, a) => sum + a.balance, 0);
  }

  // Get net profit
  static getNetProfit(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  // Get gross profit (Sales - COGS)
  static getGrossProfit(): number {
    const sales = financialDb.getAccountByCode('4100')?.balance || 0;
    const cogs = financialDb.getAccountByCode('5100')?.balance || 0;
    return sales - cogs;
  }

  // Verify accounting equation: Assets = Liabilities + Equity
  static verifyAccountingEquation(): boolean {
    const assets = this.getTotalAssets();
    const liabilities = this.getTotalLiabilities();
    const equity = this.getTotalEquity();
    const netProfit = this.getNetProfit();
    
    // Assets should equal Liabilities + Equity + Net Profit (for current period)
    return Math.abs(assets - (liabilities + equity + netProfit)) < 1;
  }

  // Verify all entries are balanced
  static verifyAllEntriesBalanced(): boolean {
    const entries = financialDb.getJournalEntries().filter(e => e.status === 'posted');
    return entries.every(entry => {
      const debit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
      const credit = entry.lines.reduce((sum, l) => sum + l.credit, 0);
      return Math.abs(debit - credit) < 0.01;
    });
  }
}

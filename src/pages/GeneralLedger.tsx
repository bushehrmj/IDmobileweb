import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalaliFull } from '../lib/auth';
import { financialDb, type JournalEntry } from '../lib/financialDb';
import { db } from '../lib/db';
import Button from '../components/ui/Button';
import { BookOpen, Download, Printer, Search, Filter, CheckCircle, XCircle } from 'lucide-react';

export default function GeneralLedger() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = () => {
    setEntries(financialDb.getJournalEntries().reverse());
  };

  const accounts = financialDb.getAccounts();

  const filtered = entries.filter(e => {
    const matchSearch = e.description.includes(search) || e.entryNumber.includes(search);
    const date = new Date(e.date);
    const matchDateFrom = !dateFrom || date >= new Date(dateFrom);
    const matchDateTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
    const matchAccount = selectedAccount === 'all' || e.lines.some(l => l.accountCode === selectedAccount);
    return matchSearch && matchDateFrom && matchDateTo && matchAccount;
  });

  const totalDebit = filtered.reduce((sum, e) => sum + e.lines.reduce((s, l) => s + l.debit, 0), 0);
  const totalCredit = filtered.reduce((sum, e) => sum + e.lines.reduce((s, l) => s + l.credit, 0), 0);

  const exportCSV = () => {
    const headers = ['تاریخ', 'شماره سند', 'شرح', 'کد حساب', 'نام حساب', 'بدهکار', 'بستانکار', 'مرجع'];
    const rows: string[][] = [];
    
    filtered.forEach(entry => {
      entry.lines.forEach(line => {
        rows.push([
          toJalaliFull(entry.date),
          entry.entryNumber,
          entry.description,
          line.accountCode,
          line.accountName,
          line.debit.toString(),
          line.credit.toString(),
          entry.referenceId,
        ]);
      });
    });

    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={28} className="text-blue-500" />
            دفتر کل
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ثبت‌های حسابداری و اسناد مالی</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download size={18} />
            اکسل
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={18} />
            چاپ
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تعداد اسناد</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{filtered.length}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جمع بدهکار</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(totalDebit, settings.currency)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جمع بستانکار</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalCredit, settings.currency)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">فیلتر و جستجو</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو شرح یا شماره سند..." 
              className="input pr-12" 
            />
          </div>
          <select 
            value={selectedAccount} 
            onChange={e => setSelectedAccount(e.target.value)}
            className="input"
          >
            <option value="all">همه حساب‌ها</option>
            {accounts.map(a => <option key={a.id} value={a.code}>{a.code} - {a.name}</option>)}
          </select>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={e => setDateFrom(e.target.value)}
            className="input" 
          />
        </div>
      </div>

      {/* Entries Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>شماره سند</th>
                <th>شرح</th>
                <th>کد</th>
                <th>حساب</th>
                <th className="text-left">بدهکار</th>
                <th className="text-left">بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(entry => (
                entry.lines.map((line, idx) => (
                  <tr key={`${entry.id}-${idx}`}>
                    <td className="text-xs">{toJalaliFull(entry.date)}</td>
                    <td className="text-xs font-mono">{entry.entryNumber}</td>
                    <td className="text-xs">{entry.description}</td>
                    <td className="text-xs font-mono">{line.accountCode}</td>
                    <td className="text-xs">{line.accountName}</td>
                    <td className="text-left text-xs">
                      {line.debit > 0 ? (
                        <span className="text-blue-600 font-bold">{formatCurrency(line.debit, settings.currency)}</span>
                      ) : '-'}
                    </td>
                    <td className="text-left text-xs">
                      {line.credit > 0 ? (
                        <span className="text-green-600 font-bold">{formatCurrency(line.credit, settings.currency)}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-700 font-bold">
                <td colSpan={5} className="px-3 py-3 text-sm">جمع</td>
                <td className="px-3 py-3 text-left text-sm text-blue-600">{formatCurrency(totalDebit, settings.currency)}</td>
                <td className="px-3 py-3 text-left text-sm text-green-600">{formatCurrency(totalCredit, settings.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">سندی یافت نشد</p>
          </div>
        )}
        {filtered.length > 100 && (
          <p className="text-center text-xs text-slate-400 py-2">
            نمایش ۱۰۰ سند اول از {filtered.length}
          </p>
        )}
      </div>

      {/* Balance Check */}
      <div className="card p-5 text-center">
        {Math.abs(totalDebit - totalCredit) < 1 ? (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle size={20} />
            <span className="text-sm font-medium">اسناد متوازن هستند</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
            <XCircle size={20} />
            <span className="text-sm font-medium">
              مغایرت: {formatCurrency(Math.abs(totalDebit - totalCredit), settings.currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

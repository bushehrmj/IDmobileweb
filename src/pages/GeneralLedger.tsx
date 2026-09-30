import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalaliFull } from '../lib/auth';
import { financialDb, type JournalEntry } from '../lib/financialDb';
import { db } from '../lib/db';
import { BookOpen, Download, Printer, Search } from 'lucide-react';

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
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BookOpen size={20} className="text-blue-500" />
          دفتر کل
        </h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Download size={14} /> اکسل
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Printer size={14} /> چاپ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[150px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجو شرح یا شماره سند..."
            className="w-full pr-9 pl-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
        </div>
        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
          <option value="all">همه حساب‌ها</option>
          {accounts.map(a => <option key={a.id} value={a.code}>{a.code} - {a.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">تعداد اسناد</p>
          <p className="text-lg font-bold">{filtered.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">جمع بدهکار</p>
          <p className="text-sm font-bold text-blue-600">{formatCurrency(totalDebit, settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">جمع بستانکار</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(totalCredit, settings.currency)}</p>
        </div>
      </div>

      {/* Entries */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">تاریخ</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">شماره سند</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">شرح</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">کد</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">حساب</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">بدهکار</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(entry => (
                entry.lines.map((line, idx) => (
                  <tr key={`${entry.id}-${idx}`} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2 text-xs">{toJalaliFull(entry.date)}</td>
                    <td className="px-3 py-2 text-xs font-mono">{entry.entryNumber}</td>
                    <td className="px-3 py-2 text-xs">{entry.description}</td>
                    <td className="px-3 py-2 text-xs font-mono">{line.accountCode}</td>
                    <td className="px-3 py-2 text-xs">{line.accountName}</td>
                    <td className="px-3 py-2 text-left text-xs">
                      {line.debit > 0 ? <span className="text-blue-600 font-bold">{formatCurrency(line.debit, settings.currency)}</span> : '-'}
                    </td>
                    <td className="px-3 py-2 text-left text-xs">
                      {line.credit > 0 ? <span className="text-green-600 font-bold">{formatCurrency(line.credit, settings.currency)}</span> : '-'}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-700 font-bold">
              <tr>
                <td colSpan={5} className="px-3 py-2 text-sm">جمع</td>
                <td className="px-3 py-2 text-left text-sm text-blue-600">{formatCurrency(totalDebit, settings.currency)}</td>
                <td className="px-3 py-2 text-left text-sm text-green-600">{formatCurrency(totalCredit, settings.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">سندی یافت نشد</p>}
        {filtered.length > 100 && <p className="text-center text-xs text-slate-400 py-2">نمایش ۱۰۰ سند اول از {filtered.length}</p>}
      </div>

      {/* Balance Check */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
        {Math.abs(totalDebit - totalCredit) < 1 ? (
          <span className="text-sm text-green-600">✓ اسناد متوازن هستند</span>
        ) : (
          <span className="text-sm text-red-600">✗ مغایرت: {formatCurrency(Math.abs(totalDebit - totalCredit), settings.currency)}</span>
        )}
      </div>
    </div>
  );
}

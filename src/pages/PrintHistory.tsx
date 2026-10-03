import React, { useState, useEffect } from 'react';
import { printManager, PrintJob } from '../lib/printing/PrintManager';
import Button from '../components/ui/Button';
import { History, Printer, FileText, Trash2, Download } from 'lucide-react';
import { toJalaliFull } from '../lib/auth';

export default function PrintHistory() {
  const [history, setHistory] = useState<PrintJob[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const printHistory = printManager.getHistory();
    setHistory(printHistory);
  };

  const filteredHistory = history.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'completed') return job.status === 'completed';
    if (filter === 'failed') return job.status === 'failed';
    return true;
  });

  const handleClearHistory = () => {
    if (confirm('آیا از پاک کردن تمام تاریخچه چاپ مطمئن هستید؟')) {
      // Clear history
      localStorage.removeItem('print-manager-data');
      loadHistory();
    }
  };

  const handleExportHistory = () => {
    const csv = [
      ['تاریخ', 'نوع سند', 'شماره سند', 'پرینتر', 'کاربر', 'صفحات', 'نسخه‌ها', 'وضعیت'],
      ...history.map(job => [
        toJalaliFull(job.timestamp),
        job.documentType,
        job.documentNumber,
        job.printer,
        job.user,
        job.pages.toString(),
        job.copies.toString(),
        job.status === 'completed' ? 'موفق' : job.status === 'failed' ? 'ناموفق' : 'لغو شده',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      invoice: 'فاکتور فروش',
      receipt: 'رسید فروش',
      'repair-receipt': 'رسید تعمیر',
      'repair-invoice': 'فاکتور تعمیر',
      report: 'گزارش',
      list: 'لیست',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">موفق</span>;
      case 'failed':
        return <span className="badge badge-error">ناموفق</span>;
      case 'cancelled':
        return <span className="badge badge-warning">لغو شده</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تاریخچه چاپ</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مشاهده تمام چاپ‌های انجام شده</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportHistory}>
            <Download size={18} />
            خروجی اکسل
          </Button>
          <Button variant="danger" onClick={handleClearHistory}>
            <Trash2 size={18} />
            پاک کردن تاریخچه
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <History size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل چاپ‌ها</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{history.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <History size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">موفق</p>
              <p className="text-2xl font-bold text-green-600">
                {history.filter(j => j.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <History size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">ناموفق</p>
              <p className="text-2xl font-bold text-red-600">
                {history.filter(j => j.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <History size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">فیلتر</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            همه
          </Button>
          <Button
            variant={filter === 'completed' ? 'success' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            موفق
          </Button>
          <Button
            variant={filter === 'failed' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => setFilter('failed')}
          >
            ناموفق
          </Button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="card p-12 text-center">
            <History size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">تاریخچه‌ای وجود ندارد</p>
          </div>
        ) : (
          filteredHistory.map(job => (
            <div key={job.id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {getDocumentTypeLabel(job.documentType)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {job.documentNumber || 'بدون شماره'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Printer size={12} />
                        {job.printer}
                      </span>
                      <span>{toJalaliFull(job.timestamp)}</span>
                      <span>{job.pages} صفحه</span>
                      <span>{job.copies} نسخه</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  {getStatusBadge(job.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

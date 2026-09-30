import React, { useState } from 'react';
import { useAuth, useToast } from '../lib/auth';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Database, Download, Upload, AlertTriangle, Trash2 } from 'lucide-react';

export default function BackupPage() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const createBackup = () => {
    const data = db.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idmobile_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'پشتیبان ایجاد و دانلود شد');
    db.addAuditLog({
      id: uuidv4(), userId: '', userName: '',
      action: 'create_backup', entity: 'system', entityId: '',
      ip: '127.0.0.1', date: new Date().toISOString(),
    });
  };

  const restoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const success = db.importAll(reader.result as string);
      if (success) {
        showToast('success', 'بازیابی با موفقیت انجام شد');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('error', 'خطا در بازیابی فایل');
      }
    };
    reader.readAsText(file);
    setConfirmRestore(false);
  };

  const resetSystem = () => {
    db.resetAll();
    showToast('success', 'سیستم بازنشانی شد');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <h2 className="text-lg font-bold">پشتیبان‌گیری</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Backup */}
        {hasPermission('backup.create') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Download size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold">ایجاد پشتیبان</h3>
                <p className="text-xs text-slate-500">دانلود کامل اطلاعات سیستم</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              تمام اطلاعات شامل کاربران، محصولات، فروش، خرید، مشتریان، تعمیرات و تنظیمات در فایل پشتیبان ذخیره می‌شود.
            </p>
            <button onClick={createBackup} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
              <Database size={16} /> ایجاد و دانلود پشتیبان
            </button>
          </div>
        )}

        {/* Restore */}
        {hasPermission('backup.restore') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Upload size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold">بازیابی پشتیبان</h3>
                <p className="text-xs text-slate-500">بازگرداندن اطلاعات از فایل</p>
              </div>
            </div>
            {!confirmRestore ? (
              <button onClick={() => setConfirmRestore(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                <Upload size={16} /> انتخاب فایل پشتیبان
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-bold">هشدار!</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    این عملیات تمام اطلاعات فعلی را با اطلاعات فایل پشتیبان جایگزین می‌کند. این عمل غیرقابل بازگشت است.
                  </p>
                </div>
                <input type="file" accept=".json" onChange={restoreBackup}
                  className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg p-2" />
                <button onClick={() => setConfirmRestore(false)} className="w-full py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm">انصراف</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset */}
      {hasPermission('backup.restore') && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400">بازنشانی سیستم</h3>
              <p className="text-xs text-slate-500">حذف تمام اطلاعات و شروع از ابتدا</p>
            </div>
          </div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
              <Trash2 size={16} /> بازنشانی سیستم
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400 font-bold">⚠️ تمام اطلاعات حذف خواهد شد!</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  کاربران، محصولات، فروش، خرید، مشتریان، تعمیرات و تمام اطلاعات دیگر حذف می‌شوند.
                  فقط کاربر admin با رمز پیش‌فرض باقی می‌ماند.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm">انصراف</button>
                <button onClick={resetSystem} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">تأیید بازنشانی</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

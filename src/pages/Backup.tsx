import React, { useState } from 'react';
import { useAuth, useToast } from '../lib/auth';
import { db } from '../lib/db';
import Button from '../components/ui/Button';
import { 
  Database, Download, Upload, AlertTriangle, Trash2, 
  CheckCircle, Clock, Shield
} from 'lucide-react';

export default function BackupPage() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('idmobile_last_backup')
  );

  const createBackup = () => {
    const data = db.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `idmobile_backup_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // ذخیره زمان آخرین پشتیبان
    const now = new Date().toISOString();
    localStorage.setItem('idmobile_last_backup', now);
    setLastBackup(now);
    
    showToast('success', 'پشتیبان ایجاد و دانلود شد');
    
    db.addAuditLog({
      id: crypto.randomUUID(),
      userId: '',
      userName: '',
      action: 'create_backup',
      entity: 'system',
      entityId: '',
      ip: '127.0.0.1',
      date: now,
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

  const getBackupSize = () => {
    try {
      const data = db.exportAll();
      const sizeInBytes = new Blob([data]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      return `${sizeInKB} KB`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">پشتیبان‌گیری</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت پشتیبان و بازیابی اطلاعات</p>
      </div>

      {/* Backup Info */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Database size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">وضعیت پشتیبان</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">آخرین پشتیبان</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  {lastBackup ? (
                    <>
                      <Clock size={14} className="text-slate-400" />
                      {new Date(lastBackup).toLocaleString('fa-IR')}
                    </>
                  ) : (
                    <span className="text-slate-400">هنوز پشتیبان گرفته نشده</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">حجم داده‌ها</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {getBackupSize()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Backup */}
        {hasPermission('backup.create') && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Download size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">ایجاد پشتیبان</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">دانلود کامل اطلاعات سیستم</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              تمام اطلاعات شامل کاربران، محصولات، فروش، خرید، مشتریان، تعمیرات و تنظیمات در فایل پشتیبان ذخیره می‌شود.
            </p>
            <Button variant="success" className="w-full" onClick={createBackup}>
              <Database size={18} />
              ایجاد و دانلود پشتیبان
            </Button>
          </div>
        )}

        {/* Restore Backup */}
        {hasPermission('backup.restore') && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Upload size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">بازیابی پشتیبان</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">بازگرداندن اطلاعات از فایل</p>
              </div>
            </div>
            {!confirmRestore ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  فایل پشتیبان JSON را انتخاب کنید تا اطلاعات بازیابی شود.
                </p>
                <Button variant="primary" className="w-full" onClick={() => setConfirmRestore(true)}>
                  <Upload size={18} />
                  انتخاب فایل پشتیبان
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                    <AlertTriangle size={18} />
                    <span className="font-bold">هشدار!</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    این عملیات تمام اطلاعات فعلی را با اطلاعات فایل پشتیبان جایگزین می‌کند. این عمل غیرقابل بازگشت است.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={restoreBackup}
                  className="w-full text-sm border-2 border-slate-200 dark:border-slate-600 rounded-lg p-2"
                />
                <Button variant="outline" className="w-full" onClick={() => setConfirmRestore(false)}>
                  انصراف
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset System */}
      {hasPermission('backup.restore') && (
        <div className="card p-6 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <Trash2 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-red-700 dark:text-red-400">بازنشانی سیستم</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">حذف تمام اطلاعات و شروع از ابتدا</p>
            </div>
          </div>
          {!confirmReset ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                این عملیات تمام اطلاعات سیستم را حذف کرده و سیستم را به حالت اولیه بازمی‌گرداند.
              </p>
              <Button variant="danger" className="w-full" onClick={() => setConfirmReset(true)}>
                <Trash2 size={18} />
                بازنشانی سیستم
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                  <AlertTriangle size={18} />
                  <span className="font-bold">هشدار جدی!</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                  تمام اطلاعات حذف خواهد شد!
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                  <li>کاربران و تنظیمات</li>
                  <li>محصولات و موجودی</li>
                  <li>فروش و خرید</li>
                  <li>مشتریان و تعمیرات</li>
                  <li>اطلاعات مالی</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmReset(false)}>
                  انصراف
                </Button>
                <Button variant="danger" className="flex-1" onClick={resetSystem}>
                  <CheckCircle size={18} />
                  تأیید بازنشانی
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">توصیه‌های امنیتی</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">برای حفظ اطلاعات مهم</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">پشتیبان‌گیری منظم</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                روزانه یا بعد از تغییرات مهم پشتیبان بگیرید
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">ذخیره در چند مکان</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                فایل پشتیبان را در فلش، هارد اکسترنال و فضای ابری نگهداری کنید
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">تست بازیابی</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                هر از گاهی بازیابی را تست کنید تا از صحت فایل مطمئن شوید
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { runMigration, clearLocalStorage, verifyMigration, type MigrationResult } from '../lib/migration';
import Button from '../components/ui/Button';
import { Database, Download, Upload, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function Migration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleMigration = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید داده‌ها را به Backend منتقل کنید؟\n\nاین عملیات:\n1. یک فایل Backup از localStorage ایجاد می‌کند\n2. داده‌ها را به SQLite منتقل می‌کند\n3. ممکن است چند دقیقه طول بکشد')) {
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await runMigration();
      setMigrationResult(result);
    } catch (error: any) {
      setMigrationResult({
        success: false,
        message: `❌ Migration failed: ${error.message}`,
        stats: {
          users: 0, products: 0, customers: 0, sales: 0, repairs: 0,
          purchases: 0, payments: 0, stockMovements: 0, auditLogs: 0,
          financialAccounts: 0, journalEntries: 0, cashAccounts: 0,
          bankAccounts: 0, expenses: 0, incomeTransactions: 0,
          checks: 0, transfers: 0,
        },
        errors: [error.message],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyMigration();
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearLocalStorage = () => {
    if (!showConfirmClear) {
      setShowConfirmClear(true);
      return;
    }

    clearLocalStorage();
    setShowConfirmClear(false);
    alert('✅ localStorage پاک شد. لطفاً صفحه را Refresh کنید.');
    window.location.reload();
  };

  const handleExportBackup = () => {
    const data = localStorage.getItem('idmobile_data');
    if (!data) {
      alert('❌ هیچ داده‌ای در localStorage وجود ندارد');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        localStorage.setItem('idmobile_data', JSON.stringify(data));
        alert('✅ Backup با موفقیت بازیابی شد. لطفاً صفحه را Refresh کنید.');
        window.location.reload();
      } catch (error) {
        alert('❌ خطا در بازیابی Backup');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Migration داده‌ها</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          انتقال داده‌ها از localStorage به SQLite Backend
        </p>
      </div>

      {/* Warning */}
      <div className="card p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-300 mb-2">هشدار مهم</h3>
            <p className="text-sm text-amber-800 dark:text-amber-400">
              قبل از انجام Migration، حتماً یک Backup از داده‌های خود بگیرید. این عملیات غیرقابل بازگشت است و پس از انتقال موفق، داده‌های localStorage پاک خواهند شد.
            </p>
          </div>
        </div>
      </div>

      {/* Migration Steps */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">مراحل Migration</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Export از localStorage</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                تمام داده‌ها از localStorage خوانده می‌شوند
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">ایجاد Backup</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                یک فایل JSON از داده‌ها دانلود می‌شود
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Import به Backend</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                داده‌ها به SQLite Backend منتقل می‌شوند
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Verification</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                صحت انتقال داده‌ها بررسی می‌شود
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">عملیات</h3>
        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleMigration}
            disabled={isMigrating}
          >
            {isMigrating ? (
              <>
                <Loader size={18} className="animate-spin" />
                در حال Migration...
              </>
            ) : (
              <>
                <Database size={18} />
                شروع Migration
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader size={18} className="animate-spin" />
                در حال بررسی...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                بررسی صحت Migration
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleExportBackup}>
              <Download size={18} />
              Export Backup
            </Button>
            <label className="btn btn-outline cursor-pointer">
              <Upload size={18} />
              Import Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          {showConfirmClear ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                ⚠️ آیا مطمئن هستید؟ این عملیات غیرقابل بازگشت است!
              </p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={handleClearLocalStorage}>
                  بله، پاک کن
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowConfirmClear(false)}>
                  انصراف
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="danger"
              className="w-full"
              onClick={handleClearLocalStorage}
            >
              <XCircle size={18} />
              پاک کردن localStorage
            </Button>
          )}
        </div>
      </div>

      {/* Migration Result */}
      {migrationResult && (
        <div className={`card p-6 ${
          migrationResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {migrationResult.success ? (
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            ) : (
              <XCircle size={32} className="text-red-600 dark:text-red-400" />
            )}
            <div>
              <h3 className={`text-lg font-bold ${
                migrationResult.success 
                  ? 'text-green-900 dark:text-green-300'
                  : 'text-red-900 dark:text-red-300'
              }`}>
                {migrationResult.success ? 'Migration موفق' : 'Migration ناموفق'}
              </h3>
              <p className={`text-sm ${
                migrationResult.success 
                  ? 'text-green-800 dark:text-green-400'
                  : 'text-red-800 dark:text-red-400'
              }`}>
                {migrationResult.message}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {Object.entries(migrationResult.stats).map(([key, value]) => (
              <div key={key} className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{key}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{String(value)}</p>
              </div>
            ))}
          </div>

          {/* Errors */}
          {migrationResult.errors.length > 0 && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="font-bold text-red-900 dark:text-red-300 mb-2">خطاها:</p>
              <ul className="space-y-1">
                {migrationResult.errors.map((error: string, index: number) => (
                  <li key={index} className="text-sm text-red-800 dark:text-red-400">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Verification Result */}
      {verificationResult !== null && (
        <div className={`card p-6 ${
          verificationResult 
            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {verificationResult ? (
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            ) : (
              <XCircle size={32} className="text-red-600 dark:text-red-400" />
            )}
            <div>
              <h3 className={`text-lg font-bold ${
                verificationResult 
                  ? 'text-green-900 dark:text-green-300'
                  : 'text-red-900 dark:text-red-300'
              }`}>
                {verificationResult ? 'Verification موفق' : 'Verification ناموفق'}
              </h3>
              <p className={`text-sm ${
                verificationResult 
                  ? 'text-green-800 dark:text-green-400'
                  : 'text-red-800 dark:text-red-400'
              }`}>
                {verificationResult 
                  ? 'تمام داده‌ها با موفقیت منتقل شده‌اند'
                  : 'برخی داده‌ها منتقل نشده‌اند'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">راهنما</h3>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <p>
            <strong>۱. Export Backup:</strong> قبل از Migration، یک فایل Backup از داده‌های localStorage دانلود کنید.
          </p>
          <p>
            <strong>۲. شروع Migration:</strong> داده‌ها را به Backend منتقل کنید. این عملیات ممکن است چند دقیقه طول بکشد.
          </p>
          <p>
            <strong>۳. بررسی صحت:</strong> پس از Migration، صحت انتقال داده‌ها را بررسی کنید.
          </p>
          <p>
            <strong>۴. پاک کردن localStorage:</strong> اگر Migration موفق بود، می‌توانید localStorage را پاک کنید.
          </p>
          <p>
            <strong>۵. Import Backup:</strong> اگر نیاز به بازگشت به localStorage داشتید، می‌توانید فایل Backup را بازیابی کنید.
          </p>
        </div>
      </div>
    </div>
  );
}

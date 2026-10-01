import React, { useState } from 'react';
import { useAuth, useToast } from '../lib/auth';
import { db, type Settings } from '../lib/db';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Save, Lock, Wifi, QrCode, FileText, Upload } from 'lucide-react';

export default function SettingsPage() {
  const { user, hasPermission, changePassword } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings>(db.getSettings());
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showPassChange, setShowPassChange] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  const save = () => {
    db.saveSettings(settings);
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    showToast('success', 'تنظیمات ذخیره شد');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSettings({ ...settings, logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'store', label: 'فروشگاه', show: true },
    { id: 'invoice', label: 'فاکتور', show: true },
    { id: 'security', label: 'امنیت', show: hasPermission('settings.edit') },
    { id: 'network', label: 'شبکه', show: hasPermission('settings.view') },
    { id: 'logs', label: 'لاگ‌ها', show: hasPermission('settings.view') },
  ].filter(t => t.show);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تنظیمات</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت تنظیمات سیستم</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 p-2">
          {tabs.map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === t.id 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'store' && (
            <div className="space-y-4">
              <Input
                label="نام فروشگاه"
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
              />
              <Input
                label="شماره تلفن"
                value={settings.storePhone}
                onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
              />
              <Input
                label="آدرس"
                value={settings.storeAddress}
                onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">توضیحات</label>
                <textarea 
                  value={settings.storeDescription} 
                  onChange={e => setSettings({ ...settings, storeDescription: e.target.value })}
                  className="input" 
                  rows={3} 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">لوگو</label>
                <div className="flex items-center gap-4">
                  {settings.logo && <img src={settings.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">واحد پول</label>
                  <select 
                    value={settings.currency} 
                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                    className="input"
                  >
                    <option value="تومان">تومان</option>
                    <option value="ریال">ریال</option>
                  </select>
                </div>
                <Input
                  label="درصد مالیات"
                  type="number"
                  value={settings.taxRate}
                  onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">تم</label>
                  <select 
                    value={settings.theme} 
                    onChange={e => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                    className="input"
                  >
                    <option value="light">روشن</option>
                    <option value="dark">تاریک</option>
                  </select>
                </div>
                <Input
                  label="درصد سود پیش‌فرض"
                  type="number"
                  value={settings.defaultProfitPercent}
                  onChange={e => setSettings({ ...settings, defaultProfitPercent: Number(e.target.value) })}
                />
              </div>
              <Button variant="primary" className="w-full" onClick={save}>
                <Save size={18} />
                ذخیره تنظیمات
              </Button>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-blue-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">تنظیمات فاکتور</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="شروع شماره فاکتور"
                  type="number"
                  value={settings.invoiceStartNumber}
                  onChange={e => setSettings({ ...settings, invoiceStartNumber: Number(e.target.value) })}
                />
                <Input
                  label="شروع شماره تعمیر"
                  type="number"
                  value={settings.repairStartNumber}
                  onChange={e => setSettings({ ...settings, repairStartNumber: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">سایز چاپ فاکتور</label>
                <select 
                  value={settings.paperSize} 
                  onChange={e => setSettings({ ...settings, paperSize: e.target.value as Settings['paperSize'] })}
                  className="input"
                >
                  <option value="80mm">80mm (رسید حرارتی)</option>
                  <option value="a5">A5</option>
                  <option value="a4">A4</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">سایز چاپ رسید تعمیر</label>
                <select 
                  value={settings.receiptPaperSize} 
                  onChange={e => setSettings({ ...settings, receiptPaperSize: e.target.value as Settings['paperSize'] })}
                  className="input"
                >
                  <option value="80mm">80mm (رسید حرارتی)</option>
                  <option value="a5">A5</option>
                  <option value="a4">A4</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">متن بالای فاکتور</label>
                <input 
                  type="text" 
                  value={settings.invoiceHeaderNote} 
                  onChange={e => setSettings({ ...settings, invoiceHeaderNote: e.target.value })}
                  className="input"
                  placeholder="مثلاً: کالای فروخته شده پس گرفته نمی‌شود" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">متن پایین فاکتور</label>
                <input 
                  type="text" 
                  value={settings.invoiceFooterText} 
                  onChange={e => setSettings({ ...settings, invoiceFooterText: e.target.value })}
                  className="input" 
                />
              </div>

              <Button variant="primary" className="w-full" onClick={save}>
                ذخیره تنظیمات فاکتور
              </Button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <Input
                label="مدت Session (دقیقه)"
                type="number"
                value={settings.sessionTimeout}
                onChange={e => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
              />
              <div>
                <Button variant="outline" onClick={() => setShowPassChange(!showPassChange)}>
                  <Lock size={16} />
                  تغییر رمز عبور
                </Button>
              </div>
              {showPassChange && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <Input
                    label="رمز فعلی"
                    type="password"
                    value={oldPass}
                    onChange={e => setOldPass(e.target.value)}
                  />
                  <Input
                    label="رمز جدید"
                    type="password"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                  />
                  <Button variant="primary" onClick={() => {
                    const result = changePassword(oldPass, newPass);
                    if (result.success) { showToast('success', result.message); setOldPass(''); setNewPass(''); }
                    else showToast('error', result.message);
                  }}>
                    تغییر رمز
                  </Button>
                </div>
              )}
              <Button variant="primary" className="w-full" onClick={save}>
                ذخیره
              </Button>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Wifi size={16} className="text-green-500" />
                <span className="text-slate-700 dark:text-slate-300">وضعیت: فعال</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">آدرس دسترسی شبکه محلی:</p>
                <p className="font-mono text-sm font-bold text-blue-600 mb-3">{window.location.origin}</p>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.origin); showToast('success', 'آدرس کپی شد'); }}>
                  کپی آدرس
                </Button>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <QrCode size={80} className="mx-auto mb-3 text-slate-400" />
                <p className="text-xs text-slate-500 dark:text-slate-400">QR Code برای اتصال موبایل</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">دوربین موبایل را روی این کد بگیرید</p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">لاگ عملیات</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {db.getAuditLogs().slice(0, 50).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900 dark:text-white">{log.userName}</span>
                      <span className="text-slate-400 dark:text-slate-500">{new Date(log.date).toLocaleString('fa-IR')}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{log.action} - {log.entity} {log.newValue && `| ${log.newValue}`}</p>
                  </div>
                ))}
                {db.getAuditLogs().length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">لاگی ثبت نشده</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

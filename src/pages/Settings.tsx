import React, { useState } from 'react';
import { useAuth, useToast } from '../lib/auth';
import { db, type Settings } from '../lib/db';
import { Save, Lock, Wifi, QrCode, FileText } from 'lucide-react';

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
    <div className="space-y-4 pb-20 lg:pb-0">
      <h2 className="text-lg font-bold">تنظیمات</h2>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm ${activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'store' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div>
            <label className="text-xs text-slate-500">نام فروشگاه</label>
            <input type="text" value={settings.storeName} onChange={e => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
          </div>
          <div>
            <label className="text-xs text-slate-500">شماره تلفن</label>
            <input type="text" value={settings.storePhone} onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
          </div>
          <div>
            <label className="text-xs text-slate-500">آدرس</label>
            <input type="text" value={settings.storeAddress} onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
          </div>
          <div>
            <label className="text-xs text-slate-500">توضیحات</label>
            <textarea value={settings.storeDescription} onChange={e => setSettings({ ...settings, storeDescription: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
          </div>
          <div>
            <label className="text-xs text-slate-500">لوگو</label>
            <div className="flex items-center gap-3 mt-1">
              {settings.logo && <img src={settings.logo} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">واحد پول</label>
              <select value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="تومان">تومان</option>
                <option value="ریال">ریال</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">درصد مالیات</label>
              <input type="number" value={settings.taxRate} onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">تم</label>
              <select value={settings.theme} onChange={e => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                <option value="light">روشن</option>
                <option value="dark">تاریک</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">درصد سود پیش‌فرض</label>
              <input type="number" value={settings.defaultProfitPercent} onChange={e => setSettings({ ...settings, defaultProfitPercent: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
          </div>
          <button onClick={save} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Save size={16} /> ذخیره تنظیمات
          </button>
        </div>
      )}

      {activeTab === 'invoice' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-blue-500" />
            <h3 className="font-bold">تنظیمات فاکتور</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">شروع شماره فاکتور</label>
              <input type="number" value={settings.invoiceStartNumber} onChange={e => setSettings({ ...settings, invoiceStartNumber: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
            <div>
              <label className="text-xs text-slate-500">شروع شماره تعمیر</label>
              <input type="number" value={settings.repairStartNumber} onChange={e => setSettings({ ...settings, repairStartNumber: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">سایز چاپ فاکتور</label>
            <select value={settings.paperSize} onChange={e => setSettings({ ...settings, paperSize: e.target.value as Settings['paperSize'] })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
              <option value="80mm">80mm (رسید حرارتی)</option>
              <option value="a5">A5</option>
              <option value="a4">A4</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500">سایز چاپ رسید تعمیر</label>
            <select value={settings.receiptPaperSize} onChange={e => setSettings({ ...settings, receiptPaperSize: e.target.value as Settings['paperSize'] })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
              <option value="80mm">80mm (رسید حرارتی)</option>
              <option value="a5">A5</option>
              <option value="a4">A4</option>
            </select>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            <p className="text-sm font-bold mb-2">نمایش در فاکتور</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'showLogoOnInvoice', label: 'لوگو' },
                { key: 'showStorePhone', label: 'تلفن فروشگاه' },
                { key: 'showStoreAddress', label: 'آدرس فروشگاه' },
                { key: 'showCustomerInfo', label: 'اطلاعات مشتری' },
                { key: 'showSellerName', label: 'نام فروشنده' },
                { key: 'showIMEI', label: 'IMEI' },
                { key: 'showBarcode', label: 'بارکد' },
                { key: 'showTax', label: 'مالیات' },
                { key: 'showDiscount', label: 'تخفیف' },
                { key: 'showNotes', label: 'یادداشت' },
                { key: 'showFooter', label: 'پاورقی' },
                { key: 'showProfitOnInvoice', label: 'سود (فقط مدیر)' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                  <input type="checkbox" checked={Boolean((settings as unknown as Record<string, unknown>)[opt.key])}
                    onChange={e => setSettings({ ...settings, [opt.key]: e.target.checked } as Settings)} className="rounded" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">متن بالای فاکتور</label>
            <input type="text" value={settings.invoiceHeaderNote} onChange={e => setSettings({ ...settings, invoiceHeaderNote: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700"
              placeholder="مثلاً: کالای فروخته شده پس گرفته نمی‌شود" />
          </div>

          <div>
            <label className="text-xs text-slate-500">متن پایین فاکتور</label>
            <input type="text" value={settings.invoiceFooterText} onChange={e => setSettings({ ...settings, invoiceFooterText: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
          </div>

          <button onClick={save} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">ذخیره تنظیمات فاکتور</button>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div>
            <label className="text-xs text-slate-500">مدت Session (دقیقه)</label>
            <input type="number" value={settings.sessionTimeout} onChange={e => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
          </div>
          <div>
            <button onClick={() => setShowPassChange(!showPassChange)} className="text-sm text-blue-600 flex items-center gap-1">
              <Lock size={14} /> تغییر رمز عبور
            </button>
          </div>
          {showPassChange && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <input type="password" placeholder="رمز فعلی" value={oldPass} onChange={e => setOldPass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700" />
              <input type="password" placeholder="رمز جدید" value={newPass} onChange={e => setNewPass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700" />
              <button onClick={() => {
                const result = changePassword(oldPass, newPass);
                if (result.success) { showToast('success', result.message); setOldPass(''); setNewPass(''); }
                else showToast('error', result.message);
              }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">تغییر رمز</button>
            </div>
          )}
          <button onClick={save} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">ذخیره</button>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Wifi size={16} className="text-green-500" />
            <span>وضعیت: فعال</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">آدرس دسترسی شبکه محلی:</p>
            <p className="font-mono text-sm font-bold text-blue-600">{window.location.origin}</p>
            <button onClick={() => { navigator.clipboard.writeText(window.location.origin); showToast('success', 'آدرس کپی شد'); }}
              className="mt-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">کپی آدرس</button>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
            <QrCode size={80} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">QR Code برای اتصال موبایل</p>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-sm mb-3">لاگ عملیات</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {db.getAuditLogs().slice(0, 50).map(log => (
              <div key={log.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.userName}</span>
                  <span className="text-slate-400">{new Date(log.date).toLocaleString('fa-IR')}</span>
                </div>
                <p className="text-slate-500 mt-0.5">{log.action} - {log.entity} {log.newValue && `| ${log.newValue}`}</p>
              </div>
            ))}
            {db.getAuditLogs().length === 0 && <p className="text-sm text-slate-500 text-center py-4">لاگی ثبت نشده</p>}
          </div>
        </div>
      )}
    </div>
  );
}

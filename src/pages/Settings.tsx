import React, { useState } from 'react';
import { useAuth, useToast } from '../lib/auth';
import { db, type Settings } from '../lib/db';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Save, Store, FileText, Printer, Palette, Shield, 
  Globe, Clock, Percent, Hash, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

export default function SettingsPage() {
  const { user, hasPermission, changePassword } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings>(db.getSettings());
  const [activeTab, setActiveTab] = useState('store');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const save = () => {
    db.saveSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast('success', 'تنظیمات با موفقیت ذخیره شد');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings({ ...settings, logo: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'store', label: 'فروشگاه', icon: Store, show: true },
    { id: 'invoice', label: 'فاکتور', icon: FileText, show: true },
    { id: 'print', label: 'چاپ', icon: Printer, show: true },
    { id: 'appearance', label: 'ظاهر', icon: Palette, show: true },
    { id: 'security', label: 'امنیت', icon: Shield, show: hasPermission('settings.edit') },
    { id: 'network', label: 'شبکه', icon: Globe, show: hasPermission('settings.view') },
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
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 p-2 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === t.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Store Settings */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">اطلاعات فروشگاه</h3>
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
                      {settings.logo && (
                        <img src={settings.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700" />
                      )}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">تنظیمات مالی</h3>
                <div className="grid grid-cols-2 gap-4">
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
                  <Input
                    label="درصد سود پیش‌فرض"
                    type="number"
                    value={settings.defaultProfitPercent}
                    onChange={e => setSettings({ ...settings, defaultProfitPercent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={save}>
                <Save size={18} />
                ذخیره تنظیمات
              </Button>
            </div>
          )}

          {/* Invoice Settings */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">شماره‌گذاری</h3>
                <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">محتوای فاکتور</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showLogoOnInvoice}
                      onChange={e => setSettings({ ...settings, showLogoOnInvoice: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش لوگو</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">لوگوی فروشگاه در بالای فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showStorePhone}
                      onChange={e => setSettings({ ...settings, showStorePhone: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش شماره تلفن</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">شماره تلفن فروشگاه در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showStoreAddress}
                      onChange={e => setSettings({ ...settings, showStoreAddress: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش آدرس</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">آدرس فروشگاه در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showCustomerInfo}
                      onChange={e => setSettings({ ...settings, showCustomerInfo: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش اطلاعات مشتری</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">نام و مشخصات مشتری در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showSellerName}
                      onChange={e => setSettings({ ...settings, showSellerName: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش نام فروشنده</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">نام فروشنده در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showIMEI}
                      onChange={e => setSettings({ ...settings, showIMEI: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش IMEI</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">شماره IMEI کالا در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showBarcode}
                      onChange={e => setSettings({ ...settings, showBarcode: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش بارکد</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">بارکد کالا در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showDiscount}
                      onChange={e => setSettings({ ...settings, showDiscount: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش تخفیف</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">مبلغ تخفیف در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showTax}
                      onChange={e => setSettings({ ...settings, showTax: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش مالیات</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">مبلغ مالیات در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showNotes}
                      onChange={e => setSettings({ ...settings, showNotes: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش یادداشت</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">یادداشت فاکتور در فاکتور نمایش داده شود</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.showFooter}
                      onChange={e => setSettings({ ...settings, showFooter: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">نمایش پاورقی</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">متن پاورقی در پایین فاکتور نمایش داده شود</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">متون فاکتور</h3>
                <div className="space-y-4">
                  <Input
                    label="متن بالای فاکتور"
                    value={settings.invoiceHeaderNote}
                    onChange={e => setSettings({ ...settings, invoiceHeaderNote: e.target.value })}
                    placeholder="مثال: کالای فروخته شده پس گرفته نمی‌شود"
                  />
                  <Input
                    label="متن پایین فاکتور"
                    value={settings.invoiceFooterText}
                    onChange={e => setSettings({ ...settings, invoiceFooterText: e.target.value })}
                    placeholder="مثال: از خرید شما متشکریم"
                  />
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={save}>
                <Save size={18} />
                ذخیره تنظیمات فاکتور
              </Button>
            </div>
          )}

          {/* Print Settings */}
          {activeTab === 'print' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">اندازه کاغذ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">اندازه فاکتور</label>
                    <select
                      value={settings.paperSize}
                      onChange={e => setSettings({ ...settings, paperSize: e.target.value as Settings['paperSize'] })}
                      className="input"
                    >
                      <option value="80mm">80mm (حرارتی)</option>
                      <option value="a5">A5</option>
                      <option value="a4">A4</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">اندازه رسید تعمیر</label>
                    <select
                      value={settings.receiptPaperSize}
                      onChange={e => setSettings({ ...settings, receiptPaperSize: e.target.value as Settings['paperSize'] })}
                      className="input"
                    >
                      <option value="80mm">80mm (حرارتی)</option>
                      <option value="a5">A5</option>
                      <option value="a4">A4</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={save}>
                <Save size={18} />
                ذخیره تنظیمات چاپ
              </Button>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">تم</h3>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">حالت نمایش</label>
                  <select
                    value={settings.theme}
                    onChange={e => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                    className="input"
                  >
                    <option value="light">روشن</option>
                    <option value="dark">تاریک</option>
                  </select>
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={save}>
                <Save size={18} />
                ذخیره تنظیمات ظاهر
              </Button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Session</h3>
                <Input
                  label="مدت زمان Session (دقیقه)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={e => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">تغییر رمز عبور</h3>
                <div className="space-y-4">
                  <Input
                    label="رمز عبور فعلی"
                    type="password"
                    value={oldPass}
                    onChange={e => setOldPass(e.target.value)}
                  />
                  <Input
                    label="رمز عبور جدید"
                    type="password"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    onClick={() => {
                      const result = changePassword(oldPass, newPass);
                      if (result.success) {
                        showToast('success', result.message);
                        setOldPass('');
                        setNewPass('');
                      } else {
                        showToast('error', result.message);
                      }
                    }}
                  >
                    تغییر رمز عبور
                  </Button>
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={save}>
                <Save size={18} />
                ذخیره تنظیمات امنیتی
              </Button>
            </div>
          )}

          {/* Network Settings */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">اطلاعات شبکه</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">آدرس دسترسی شبکه محلی:</p>
                  <p className="font-mono text-sm font-bold text-blue-600 mb-3">{window.location.origin}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      showToast('success', 'آدرس کپی شد');
                    }}
                  >
                    کپی آدرس
                  </Button>
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={save}>
                <Save size={18} />
                ذخیره تنظیمات شبکه
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

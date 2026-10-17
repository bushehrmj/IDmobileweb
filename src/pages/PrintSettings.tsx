import React, { useState, useEffect } from 'react';
import { printManager, PrintSettings, PrintPreset } from '../lib/printing/PrintManager';
import Button from '../components/ui/Button';
import { Printer, Save, Trash2, Edit, Plus, Check, X } from 'lucide-react';

export default function PrintSettingsPage() {
  const [printers, setPrinters] = useState<Array<{name: string, status: string, isDefault: boolean}>>([]);
  const [presets, setPresets] = useState<PrintPreset[]>([]);
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PrintPreset | null>(null);
  const [presetForm, setPresetForm] = useState({
    name: '',
    documentType: 'invoice',
    paperSize: 'A4',
    orientation: 'portrait',
    marginTop: 10,
    marginBottom: 10,
    marginRight: 10,
    marginLeft: 10,
    scale: 100,
    copies: 1,
    colorMode: 'color',
    quality: 'normal',
  });

  useEffect(() => {
    loadPrinters();
    loadPresets();
  }, []);

  const loadPrinters = async () => {
    const printerList = await printManager.getPrinters();
    setPrinters(printerList);
  };

  const loadPresets = () => {
    const presetList = printManager.getPresets();
    setPresets(presetList);
  };

  const handleSavePreset = () => {
    if (!presetForm.name) {
      alert('لطفاً نام preset را وارد کنید');
      return;
    }

    const preset: PrintPreset = {
      id: editingPreset?.id || Date.now().toString(),
      name: presetForm.name,
      documentType: presetForm.documentType,
      settings: {
        printerName: 'Default Printer',
        printerStatus: 'online',
        paperSize: presetForm.paperSize as any,
        paperUnit: 'mm',
        orientation: presetForm.orientation as any,
        marginTop: presetForm.marginTop,
        marginBottom: presetForm.marginBottom,
        marginRight: presetForm.marginRight,
        marginLeft: presetForm.marginLeft,
        marginPreset: 'custom',
        scale: presetForm.scale,
        scaleMode: 'custom',
        copies: presetForm.copies,
        collate: true,
        pageRange: 'all',
        colorMode: presetForm.colorMode as any,
        duplex: 'single-sided',
        paperSource: 'auto',
        quality: presetForm.quality as any,
        showHeader: true,
        showFooter: true,
        showLogo: true,
        logoSize: 'medium',
        logoAlignment: 'center',
        printContent: [],
        documentType: presetForm.documentType as any,
      },
      isDefault: false,
    };

    printManager.savePreset(preset);
    loadPresets();
    setShowPresetForm(false);
    setEditingPreset(null);
    resetForm();
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('آیا از حذف این preset مطمئن هستید؟')) {
      printManager.deletePreset(id);
      loadPresets();
    }
  };

  const handleEditPreset = (preset: PrintPreset) => {
    setEditingPreset(preset);
    setPresetForm({
      name: preset.name,
      documentType: preset.documentType,
      paperSize: preset.settings.paperSize,
      orientation: preset.settings.orientation,
      marginTop: preset.settings.marginTop,
      marginBottom: preset.settings.marginBottom,
      marginRight: preset.settings.marginRight,
      marginLeft: preset.settings.marginLeft,
      scale: preset.settings.scale,
      copies: preset.settings.copies,
      colorMode: preset.settings.colorMode,
      quality: preset.settings.quality,
    });
    setShowPresetForm(true);
  };

  const resetForm = () => {
    setPresetForm({
      name: '',
      documentType: 'invoice',
      paperSize: 'A4',
      orientation: 'portrait',
      marginTop: 10,
      marginBottom: 10,
      marginRight: 10,
      marginLeft: 10,
      scale: 100,
      copies: 1,
      colorMode: 'color',
      quality: 'normal',
    });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تنظیمات چاپ</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت پرینترها و تنظیمات چاپ</p>
        </div>
        <Button variant="primary" onClick={() => { setShowPresetForm(true); setEditingPreset(null); resetForm(); }}>
          <Plus size={18} />
          Preset جدید
        </Button>
      </div>

      {/* Printers Section */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Printer size={20} className="text-blue-500" />
          پرینترهای موجود
        </h3>
        <div className="space-y-3">
          {printers.map((printer, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${printer.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{printer.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {printer.status === 'online' ? 'آنلاین' : 'آفلاین'}
                    {printer.isDefault && ' • پیش‌فرض'}
                  </p>
                </div>
              </div>
              {printer.isDefault && (
                <span className="badge badge-success">پیش‌فرض</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Presets Section */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Preset‌های چاپ
        </h3>
        {presets.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Printer size={48} className="mx-auto mb-3 opacity-30" />
            <p>هنوز preset‌ای ایجاد نشده است</p>
          </div>
        ) : (
          <div className="space-y-3">
            {presets.map(preset => (
              <div key={preset.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{preset.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {preset.settings.paperSize} • {preset.settings.orientation === 'portrait' ? 'عمودی' : 'افقی'} • {preset.settings.copies} نسخه
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditPreset(preset)}>
                    <Edit size={16} className="text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePreset(preset.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preset Form Modal */}
      {showPresetForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingPreset ? 'ویرایش Preset' : 'Preset جدید'}
              </h3>
              <button onClick={() => { setShowPresetForm(false); setEditingPreset(null); resetForm(); }} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نام Preset *</label>
                <input
                  type="text"
                  value={presetForm.name}
                  onChange={e => setPresetForm({ ...presetForm, name: e.target.value })}
                  className="input"
                  placeholder="مثال: فاکتور A4 عمودی"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نوع سند</label>
                  <select
                    value={presetForm.documentType}
                    onChange={e => setPresetForm({ ...presetForm, documentType: e.target.value })}
                    className="input"
                  >
                    <option value="invoice">فاکتور فروش</option>
                    <option value="receipt">رسید فروش</option>
                    <option value="repair-receipt">رسید تعمیر</option>
                    <option value="repair-invoice">فاکتور تعمیر</option>
                    <option value="report">گزارش</option>
                    <option value="list">لیست</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">اندازه کاغذ</label>
                  <select
                    value={presetForm.paperSize}
                    onChange={e => setPresetForm({ ...presetForm, paperSize: e.target.value })}
                    className="input"
                  >
                    <option value="A4">A4</option>
                    <option value="A5">A5</option>
                    <option value="A6">A6</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                    <option value="80mm">80mm (حرارتی)</option>
                    <option value="58mm">58mm (حرارتی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">جهت کاغذ</label>
                <div className="flex gap-2">
                  <Button
                    variant={presetForm.orientation === 'portrait' ? 'primary' : 'outline'}
                    className="flex-1"
                    onClick={() => setPresetForm({ ...presetForm, orientation: 'portrait' })}
                  >
                    عمودی
                  </Button>
                  <Button
                    variant={presetForm.orientation === 'landscape' ? 'primary' : 'outline'}
                    className="flex-1"
                    onClick={() => setPresetForm({ ...presetForm, orientation: 'landscape' })}
                  >
                    افقی
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">حاشیه‌ها (mm)</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={presetForm.marginTop}
                    onChange={e => setPresetForm({ ...presetForm, marginTop: Number(e.target.value) })}
                    className="input"
                    placeholder="بالا"
                    min="0"
                  />
                  <input
                    type="number"
                    value={presetForm.marginBottom}
                    onChange={e => setPresetForm({ ...presetForm, marginBottom: Number(e.target.value) })}
                    className="input"
                    placeholder="پایین"
                    min="0"
                  />
                  <input
                    type="number"
                    value={presetForm.marginRight}
                    onChange={e => setPresetForm({ ...presetForm, marginRight: Number(e.target.value) })}
                    className="input"
                    placeholder="راست"
                    min="0"
                  />
                  <input
                    type="number"
                    value={presetForm.marginLeft}
                    onChange={e => setPresetForm({ ...presetForm, marginLeft: Number(e.target.value) })}
                    className="input"
                    placeholder="چپ"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">مقیاس (%)</label>
                  <input
                    type="number"
                    value={presetForm.scale}
                    onChange={e => setPresetForm({ ...presetForm, scale: Number(e.target.value) })}
                    className="input"
                    min="50"
                    max="200"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">تعداد نسخه</label>
                  <input
                    type="number"
                    value={presetForm.copies}
                    onChange={e => setPresetForm({ ...presetForm, copies: Number(e.target.value) })}
                    className="input"
                    min="1"
                    max="999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">حالت رنگ</label>
                  <select
                    value={presetForm.colorMode}
                    onChange={e => setPresetForm({ ...presetForm, colorMode: e.target.value })}
                    className="input"
                  >
                    <option value="color">رنگی</option>
                    <option value="grayscale">سیاه و سفید</option>
                    <option value="black-white">تک رنگ</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">کیفیت چاپ</label>
                  <select
                    value={presetForm.quality}
                    onChange={e => setPresetForm({ ...presetForm, quality: e.target.value })}
                    className="input"
                  >
                    <option value="draft">پیش‌نویس</option>
                    <option value="normal">معمولی</option>
                    <option value="high">بالا</option>
                    <option value="best">بهترین</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowPresetForm(false); setEditingPreset(null); resetForm(); }}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleSavePreset}>
                  <Save size={18} />
                  ذخیره Preset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

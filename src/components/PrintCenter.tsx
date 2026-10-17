/**
 * Print Center - پنجره حرفه‌ای چاپ
 * PrintCenter.tsx
 */

import React, { useState, useEffect, useRef } from 'react';
import { printManager, PrintSettings } from '../lib/printing/PrintManager';
import { pdfService } from '../lib/printing/PdfService';
import Button from './ui/Button';
import type { } from 'react';
import { 
  Printer, FileText, Settings, X, ZoomIn, ZoomOut, 
  RotateCw, ChevronLeft, ChevronRight, Save, Download
} from 'lucide-react';

interface PrintCenterProps {
  isOpen: boolean;
  onClose: () => void;
  content: React.ReactNode;
  documentType: string;
  documentTitle?: string;
}

export default function PrintCenter({ 
  isOpen, 
  onClose, 
  content, 
  documentType,
  documentTitle = 'سند'
}: PrintCenterProps) {
  const [settings, setSettings] = useState<PrintSettings>(
    printManager.getSettings(documentType)
  );
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // بارگذاری تنظیمات هنگام باز شدن
  useEffect(() => {
    if (isOpen) {
      setSettings(printManager.getSettings(documentType));
    }
  }, [isOpen, documentType]);

  // ذخیره تنظیمات هنگام تغییر
  useEffect(() => {
    printManager.saveSettings(documentType, settings);
  }, [settings, documentType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSavePdf();
      } else if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage(p => Math.max(1, p - 1));
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage(p => Math.min(totalPages, p + 1));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(200, z + 10));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(50, z - 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, totalPages]);

  const handlePrint = async () => {
    if (previewRef.current) {
      await printManager.print(previewRef.current, settings);
      onClose();
    }
  };

  const handleQuickPrint = async () => {
    if (previewRef.current) {
      await printManager.quickPrint(previewRef.current, documentType);
      onClose();
    }
  };

  const handleSavePdf = async () => {
    if (!previewRef.current) return;

    try {
      const filename = pdfService.generateFilename(
        settings.documentType,
        documentTitle,
      );

      await pdfService.downloadPdf(previewRef.current, filename, {
        format: settings.paperSize === 'custom' ? 'custom' : settings.paperSize as any,
        orientation: settings.orientation,
        margin: {
          top: `${settings.marginTop}mm`,
          right: `${settings.marginRight}mm`,
          bottom: `${settings.marginBottom}mm`,
          left: `${settings.marginLeft}mm`,
        },
        quality: settings.quality === 'best' ? 'high' : settings.quality as any,
        embedFonts: true,
        includeBackground: true,
        includeImages: true,
      });
    } catch (error) {
      console.error('PDF save error:', error);
      alert('خطا در ذخیره PDF');
    }
  };

  const updateSetting = <K extends keyof PrintSettings>(
    key: K, 
    value: PrintSettings[K]
  ) => {
    setSettings((prev: PrintSettings) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col ${
        isFullscreen ? 'w-full h-full' : 'w-[95vw] h-[90vh] max-w-7xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Printer size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              مرکز چاپ - {documentTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
            </Button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Section */}
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setZoom(z => Math.max(50, z - 10))}
                >
                  <ZoomOut size={18} />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setZoom(z => Math.min(200, z + 10))}
                >
                  <ZoomIn size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setZoom(100)}
                >
                  100%
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight size={18} />
                </Button>
                <span className="text-sm font-medium">
                  صفحه {currentPage} از {totalPages}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft size={18} />
                </Button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
              <div 
                ref={previewRef}
                className="bg-white shadow-lg"
                style={{
                  width: getPaperWidth(settings),
                  minHeight: getPaperHeight(settings),
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  padding: `${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm`,
                }}
              >
                {content}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Printer Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  پرینتر
                </label>
                <select
                  value={settings.printerName}
                  onChange={e => updateSetting('printerName', e.target.value)}
                  className="input"
                >
                  <option>Default Printer</option>
                  <option>Microsoft Print to PDF</option>
                  <option>Thermal Printer 80mm</option>
                </select>
              </div>

              {/* Paper Size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  اندازه کاغذ
                </label>
                <select
                  value={settings.paperSize}
                  onChange={e => updateSetting('paperSize', e.target.value as any)}
                  className="input"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="A5">A5 (148 × 210 mm)</option>
                  <option value="A6">A6 (105 × 148 mm)</option>
                  <option value="A3">A3 (297 × 420 mm)</option>
                  <option value="Letter">Letter (216 × 279 mm)</option>
                  <option value="Legal">Legal (216 × 356 mm)</option>
                  <option value="80mm">80mm (حرارتی)</option>
                  <option value="58mm">58mm (حرارتی)</option>
                  <option value="custom">سفارشی</option>
                </select>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  جهت کاغذ
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.orientation === 'portrait' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateSetting('orientation', 'portrait')}
                  >
                    عمودی
                  </Button>
                  <Button
                    variant={settings.orientation === 'landscape' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateSetting('orientation', 'landscape')}
                  >
                    افقی
                  </Button>
                </div>
              </div>

              {/* Margins */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  حاشیه‌ها (mm)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={settings.marginTop}
                    onChange={e => updateSetting('marginTop', Number(e.target.value))}
                    className="input"
                    placeholder="بالا"
                    min="0"
                  />
                  <input
                    type="number"
                    value={settings.marginBottom}
                    onChange={e => updateSetting('marginBottom', Number(e.target.value))}
                    className="input"
                    placeholder="پایین"
                    min="0"
                  />
                  <input
                    type="number"
                    value={settings.marginRight}
                    onChange={e => updateSetting('marginRight', Number(e.target.value))}
                    className="input"
                    placeholder="راست"
                    min="0"
                  />
                  <input
                    type="number"
                    value={settings.marginLeft}
                    onChange={e => updateSetting('marginLeft', Number(e.target.value))}
                    className="input"
                    placeholder="چپ"
                    min="0"
                  />
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  مقیاس: {settings.scale}%
                </label>
                <input
                  type="range"
                  value={settings.scale}
                  onChange={e => updateSetting('scale', Number(e.target.value))}
                  min="50"
                  max="200"
                  step="10"
                  className="w-full"
                />
              </div>

              {/* Copies */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  تعداد نسخه
                </label>
                <input
                  type="number"
                  value={settings.copies}
                  onChange={e => updateSetting('copies', Number(e.target.value))}
                  className="input"
                  min="1"
                  max="999"
                />
              </div>

              {/* Color Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  حالت رنگ
                </label>
                <select
                  value={settings.colorMode}
                  onChange={e => updateSetting('colorMode', e.target.value as any)}
                  className="input"
                >
                  <option value="color">رنگی</option>
                  <option value="grayscale">سیاه و سفید</option>
                  <option value="black-white">تک رنگ</option>
                </select>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  کیفیت چاپ
                </label>
                <select
                  value={settings.quality}
                  onChange={e => updateSetting('quality', e.target.value as any)}
                  className="input"
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="normal">معمولی</option>
                  <option value="high">بالا</option>
                  <option value="best">بهترین</option>
                </select>
              </div>

              {/* Header/Footer */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showHeader}
                    onChange={e => updateSetting('showHeader', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">نمایش هدر</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showFooter}
                    onChange={e => updateSetting('showFooter', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">نمایش فوتر</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showLogo}
                    onChange={e => updateSetting('showLogo', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">نمایش لوگو</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSavePdf}>
              <Download size={18} />
              ذخیره PDF
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              لغو
            </Button>
            <Button variant="secondary" onClick={handleQuickPrint}>
              <Printer size={18} />
              چاپ سریع
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              <Printer size={18} />
              چاپ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getPaperWidth(settings: PrintSettings): string {
  switch (settings.paperSize) {
    case 'A4': return settings.orientation === 'portrait' ? '210mm' : '297mm';
    case 'A5': return settings.orientation === 'portrait' ? '148mm' : '210mm';
    case 'A6': return settings.orientation === 'portrait' ? '105mm' : '148mm';
    case '80mm': return '80mm';
    case '58mm': return '58mm';
    default: return '210mm';
  }
}

function getPaperHeight(settings: PrintSettings): string {
  switch (settings.paperSize) {
    case 'A4': return settings.orientation === 'portrait' ? '297mm' : '210mm';
    case 'A5': return settings.orientation === 'portrait' ? '210mm' : '148mm';
    case 'A6': return settings.orientation === 'portrait' ? '148mm' : '105mm';
    case '80mm': return 'auto';
    case '58mm': return 'auto';
    default: return '297mm';
  }
}

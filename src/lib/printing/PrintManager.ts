/**
 * Print Manager - مدیریت مرکزی چاپ
 * PrintManager.ts
 */

export interface PrintSettings {
  // Printer
  printerName: string;
  printerStatus: 'online' | 'offline' | 'error';
  
  // Paper
  paperSize: 'A4' | 'A5' | 'A6' | 'A3' | 'Letter' | 'Legal' | 'Executive' | 'B5' | '80mm' | '58mm' | 'custom';
  customWidth?: number;
  customHeight?: number;
  paperUnit: 'mm' | 'cm' | 'inch';
  
  // Orientation
  orientation: 'portrait' | 'landscape';
  
  // Margins (in mm)
  marginTop: number;
  marginBottom: number;
  marginRight: number;
  marginLeft: number;
  marginPreset: 'normal' | 'narrow' | 'wide' | 'custom';
  
  // Scale
  scale: number; // percentage
  scaleMode: 'custom' | 'fit-page' | 'fit-width' | 'actual-size';
  
  // Copies
  copies: number;
  collate: boolean;
  
  // Page Range
  pageRange: 'all' | 'current' | 'selected' | 'custom';
  customRange?: string;
  
  // Color
  colorMode: 'color' | 'grayscale' | 'black-white';
  
  // Duplex
  duplex: 'single-sided' | 'double-sided-long' | 'double-sided-short' | 'none';
  
  // Paper Source
  paperSource: 'auto' | 'tray1' | 'tray2' | 'manual' | 'rear';
  
  // Quality
  quality: 'draft' | 'normal' | 'high' | 'best';
  dpi?: number;
  
  // Header/Footer
  showHeader: boolean;
  showFooter: boolean;
  headerContent?: string;
  footerContent?: string;
  
  // Logo
  showLogo: boolean;
  logoSize: 'small' | 'medium' | 'large';
  logoAlignment: 'left' | 'center' | 'right';
  
  // Content
  printContent: string[]; //哪些内容要打印
  
  // Preset
  presetName?: string;
  
  // Document Type
  documentType: 'invoice' | 'receipt' | 'repair-receipt' | 'repair-invoice' | 'report' | 'list';
}

export interface PrintJob {
  id: string;
  documentType: string;
  documentNumber: string;
  printer: string;
  user: string;
  timestamp: Date;
  pages: number;
  copies: number;
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'cancelled';
}

export interface PrintPreset {
  id: string;
  name: string;
  documentType: string;
  settings: PrintSettings;
  isDefault: boolean;
}

export class PrintManager {
  private static instance: PrintManager;
  private settings: Map<string, PrintSettings> = new Map();
  private presets: Map<string, PrintPreset> = new Map();
  private printHistory: PrintJob[] = [];
  private printQueue: PrintJob[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): PrintManager {
    if (!PrintManager.instance) {
      PrintManager.instance = new PrintManager();
    }
    return PrintManager.instance;
  }

  /**
   * دریافت تنظیمات پیش‌فرض
   */
  public getDefaultSettings(documentType: string): PrintSettings {
    const defaults: PrintSettings = {
      printerName: 'Default Printer',
      printerStatus: 'online',
      paperSize: 'A4',
      paperUnit: 'mm',
      orientation: 'portrait',
      marginTop: 10,
      marginBottom: 10,
      marginRight: 10,
      marginLeft: 10,
      marginPreset: 'normal',
      scale: 100,
      scaleMode: 'custom',
      copies: 1,
      collate: true,
      pageRange: 'all',
      colorMode: 'color',
      duplex: 'single-sided',
      paperSource: 'auto',
      quality: 'normal',
      showHeader: true,
      showFooter: true,
      showLogo: true,
      logoSize: 'medium',
      logoAlignment: 'center',
      printContent: [],
      documentType: documentType as any,
    };

    // تنظیمات مخصوص هر نوع سند
    switch (documentType) {
      case 'invoice':
        defaults.paperSize = 'A4';
        defaults.orientation = 'portrait';
        break;
      case 'receipt':
        defaults.paperSize = '80mm';
        defaults.orientation = 'portrait';
        defaults.showHeader = false;
        defaults.showFooter = false;
        break;
      case 'repair-receipt':
        defaults.paperSize = 'A5';
        defaults.orientation = 'portrait';
        break;
      case 'repair-invoice':
        defaults.paperSize = 'A4';
        defaults.orientation = 'portrait';
        break;
      case 'report':
        defaults.paperSize = 'A4';
        defaults.orientation = 'landscape';
        break;
      case 'list':
        defaults.paperSize = 'A4';
        defaults.orientation = 'portrait';
        break;
    }

    return defaults;
  }

  /**
   * دریافت تنظیمات برای یک نوع سند
   */
  public getSettings(documentType: string): PrintSettings {
    const saved = this.settings.get(documentType);
    if (saved) return saved;
    
    const defaults = this.getDefaultSettings(documentType);
    this.settings.set(documentType, defaults);
    return defaults;
  }

  /**
   * ذخیره تنظیمات
   */
  public saveSettings(documentType: string, settings: PrintSettings): void {
    this.settings.set(documentType, settings);
    this.saveToStorage();
  }

  /**
   * ذخیره Preset
   */
  public savePreset(preset: PrintPreset): void {
    this.presets.set(preset.id, preset);
    this.saveToStorage();
  }

  /**
   * دریافت تمام Presetها
   */
  public getPresets(): PrintPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * دریافت Preset بر اساس ID
   */
  public getPreset(id: string): PrintPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * حذف Preset
   */
  public deletePreset(id: string): void {
    this.presets.delete(id);
    this.saveToStorage();
  }

  /**
   * ثبت در تاریخچه چاپ
   */
  public addToHistory(job: PrintJob): void {
    this.printHistory.unshift(job);
    if (this.printHistory.length > 100) {
      this.printHistory = this.printHistory.slice(0, 100);
    }
    this.saveToStorage();
  }

  /**
   * دریافت تاریخچه چاپ
   */
  public getHistory(): PrintJob[] {
    return this.printHistory;
  }

  /**
   * اضافه به صف چاپ
   */
  public addToQueue(job: PrintJob): void {
    this.printQueue.push(job);
  }

  /**
   * دریافت صف چاپ
   */
  public getQueue(): PrintJob[] {
    return this.printQueue;
  }

  /**
   * حذف از صف چاپ
   */
  public removeFromQueue(jobId: string): void {
    this.printQueue = this.printQueue.filter(j => j.id !== jobId);
  }

  /**
   * ذخیره در localStorage
   */
  private saveToStorage(): void {
    const data = {
      settings: Object.fromEntries(this.settings),
      presets: Object.fromEntries(this.presets),
      history: this.printHistory,
    };
    localStorage.setItem('print-manager-data', JSON.stringify(data));
  }

  /**
   * بارگذاری از localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('print-manager-data');
      if (data) {
        const parsed = JSON.parse(data);
        this.settings = new Map(Object.entries(parsed.settings || {}));
        this.presets = new Map(Object.entries(parsed.presets || {}));
        this.printHistory = parsed.history || [];
      }
    } catch (error) {
      console.error('Error loading print settings:', error);
    }
  }

  /**
   * ریست تنظیمات
   */
  public resetSettings(documentType: string): void {
    this.settings.delete(documentType);
    this.saveToStorage();
  }

  /**
   * دریافت لیست پرینترها (شبیه‌سازی)
   */
  public async getPrinters(): Promise<Array<{name: string, status: string, isDefault: boolean}>> {
    // در مرورگر واقعی نمی‌توان لیست پرینترها را گرفت
    // این یک شبیه‌سازی است
    return [
      { name: 'Default Printer', status: 'online', isDefault: true },
      { name: 'Microsoft Print to PDF', status: 'online', isDefault: false },
      { name: 'Thermal Printer 80mm', status: 'online', isDefault: false },
    ];
  }

  /**
   * چاپ سریع با آخرین تنظیمات
   */
  public async quickPrint(element: HTMLElement, documentType: string): Promise<boolean> {
    const settings = this.getSettings(documentType);
    return this.print(element, settings);
  }

  /**
   * چاپ با تنظیمات
   */
  public async print(element: HTMLElement, settings: PrintSettings): Promise<boolean> {
    try {
      // اعمال تنظیمات CSS
      this.applyPrintSettings(settings);
      
      // چاپ
      window.print();
      
      // ثبت در تاریخچه
      const job: PrintJob = {
        id: Date.now().toString(),
        documentType: settings.documentType,
        documentNumber: '',
        printer: settings.printerName,
        user: '',
        timestamp: new Date(),
        pages: 1,
        copies: settings.copies,
        status: 'completed',
      };
      this.addToHistory(job);
      
      return true;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  }

  /**
   * اعمال تنظیمات چاپ به CSS
   */
  private applyPrintSettings(settings: PrintSettings): void {
    const style = document.createElement('style');
    style.id = 'print-settings-style';
    
    // حذف استایل قبلی
    const oldStyle = document.getElementById('print-settings-style');
    if (oldStyle) oldStyle.remove();
    
    // محاسبه اندازه کاغذ
    let paperWidth = '210mm';
    let paperHeight = '297mm';
    
    switch (settings.paperSize) {
      case 'A4':
        paperWidth = '210mm';
        paperHeight = '297mm';
        break;
      case 'A5':
        paperWidth = '148mm';
        paperHeight = '210mm';
        break;
      case 'A6':
        paperWidth = '105mm';
        paperHeight = '148mm';
        break;
      case '80mm':
        paperWidth = '80mm';
        paperHeight = 'auto';
        break;
      case '58mm':
        paperWidth = '58mm';
        paperHeight = 'auto';
        break;
      case 'custom':
        paperWidth = `${settings.customWidth}${settings.paperUnit}`;
        paperHeight = `${settings.customHeight}${settings.paperUnit}`;
        break;
    }
    
    if (settings.orientation === 'landscape') {
      [paperWidth, paperHeight] = [paperHeight, paperWidth];
    }
    
    style.textContent = `
      @media print {
        @page {
          size: ${paperWidth} ${paperHeight};
          margin: ${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm;
        }
        
        body {
          zoom: ${settings.scale / 100};
        }
        
        .no-print {
          display: none !important;
        }
        
        .print-only {
          display: block !important;
        }
        
        ${settings.colorMode === 'grayscale' ? `
          * {
            filter: grayscale(100%);
          }
        ` : ''}
      }
    `;
    
    document.head.appendChild(style);
  }
}

export const printManager = PrintManager.getInstance();

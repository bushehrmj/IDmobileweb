/**
 * PDF Service - سرویس تولید PDF
 * PdfService.ts
 */

export interface PdfOptions {
  filename: string;
  format: 'A4' | 'A5' | 'A6' | 'Letter' | 'Legal' | 'custom';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  quality: 'standard' | 'high' | 'low';
  embedFonts: boolean;
  includeBackground: boolean;
  includeImages: boolean;
}

export class PdfService {
  private static instance: PdfService;

  private constructor() {}

  public static getInstance(): PdfService {
    if (!PdfService.instance) {
      PdfService.instance = new PdfService();
    }
    return PdfService.instance;
  }

  /**
   * تولید PDF از HTML Element
   */
  public async generatePdf(
    element: HTMLElement,
    options: Partial<PdfOptions> = {}
  ): Promise<void> {
    const defaultOptions: PdfOptions = {
      filename: `document-${Date.now()}.pdf`,
      format: 'A4',
      orientation: 'portrait',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      quality: 'standard',
      embedFonts: true,
      includeBackground: true,
      includeImages: true,
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // استفاده از window.print() با تنظیمات PDF
      await this.printToPdf(element, finalOptions);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('خطا در تولید PDF');
    }
  }

  /**
   * چاپ به PDF
   */
  private async printToPdf(
    element: HTMLElement,
    options: PdfOptions
  ): Promise<void> {
    // ایجاد iframe مخفی
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Cannot create iframe document');
    }

    // کپی استایل‌ها
    const styles = Array.from(document.styleSheets);
    styles.forEach(style => {
      try {
        const cssText = Array.from(style.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
        const styleEl = iframeDoc.createElement('style');
        styleEl.textContent = cssText;
        iframeDoc.head.appendChild(styleEl);
      } catch (e) {
        // Cross-origin stylesheets cannot be accessed
      }
    });

    // کپی محتوا
    iframeDoc.body.innerHTML = element.innerHTML;

    // تنظیمات چاپ
    const printStyles = `
      @page {
        size: ${options.format} ${options.orientation};
        margin: ${options.margin.top} ${options.margin.right} ${options.margin.bottom} ${options.margin.left};
      }
      
      body {
        font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
        direction: rtl;
      }
      
      ${options.includeBackground ? '' : '* { background: none !important; }'}
      ${options.includeImages ? '' : 'img { display: none !important; }'}
    `;

    const styleEl = iframeDoc.createElement('style');
    styleEl.textContent = printStyles;
    iframeDoc.head.appendChild(styleEl);

    // چاپ
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // cleanup
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }

  /**
   * تولید نام فایل هوشمند
   */
  public generateFilename(
    documentType: string,
    documentNumber: string,
    customerName?: string
  ): string {
    const date = new Date().toISOString().split('T')[0];
    const typeMap: Record<string, string> = {
      invoice: 'فاکتور',
      receipt: 'رسید',
      'repair-receipt': 'رسید-تعمیر',
      'repair-invoice': 'فاکتور-تعمیر',
      report: 'گزارش',
      list: 'لیست',
    };

    const typeName = typeMap[documentType] || 'سند';
    const customer = customerName ? `-${customerName.replace(/\s+/g, '-')}` : '';
    
    return `${typeName}-${documentNumber}${customer}-${date}.pdf`;
  }

  /**
   * دانلود PDF
   */
  public async downloadPdf(
    element: HTMLElement,
    filename: string,
    options: Partial<PdfOptions> = {}
  ): Promise<void> {
    const finalOptions: PdfOptions = {
      filename,
      format: 'A4',
      orientation: 'portrait',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      quality: 'standard',
      embedFonts: true,
      includeBackground: true,
      includeImages: true,
      ...options,
    };

    await this.generatePdf(element, finalOptions);
  }
}

export const pdfService = PdfService.getInstance();

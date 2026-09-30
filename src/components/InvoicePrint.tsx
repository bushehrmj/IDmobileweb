import React, { useEffect } from 'react';
import { db, type Sale } from '../lib/db';
import { formatCurrency, toJalali, toJalaliFull } from '../lib/auth';
import { Printer, X } from 'lucide-react';

interface InvoicePrintProps {
  saleId: string;
  onClose: () => void;
}

export default function InvoicePrint({ saleId, onClose }: InvoicePrintProps) {
  const sale = db.getSale(saleId);
  const settings = db.getSettings();

  useEffect(() => {
    // Auto print on load (optional)
    // setTimeout(() => window.print(), 500);
  }, []);

  if (!sale) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-red-500">فاکتور یافت نشد</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">بستن</button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Controls */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-3 flex items-center justify-between no-print z-10">
          <h3 className="font-bold">چاپ فاکتور #{sale.invoiceNumber}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
              <Printer size={14} /> چاپ
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className={`p-6 ${settings.paperSize === '80mm' ? 'invoice-80mm' : settings.paperSize === 'a5' ? 'invoice-a5' : 'invoice-a4'}`} dir="rtl">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
            {settings.logo && settings.showLogoOnInvoice && (
              <img src={settings.logo} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-cover" />
            )}
            <h1 className="text-xl font-bold">{settings.storeName}</h1>
            {settings.showStorePhone && settings.storePhone && <p className="text-sm">تلفن: {settings.storePhone}</p>}
            {settings.showStoreAddress && settings.storeAddress && <p className="text-xs mt-1">{settings.storeAddress}</p>}
            {settings.invoiceHeaderNote && (
              <p className="text-xs text-slate-600 mt-1">{settings.invoiceHeaderNote}</p>
            )}
            <div className="mt-3 text-sm">
              <p>فاکتور فروش شماره: <span className="font-bold">{sale.invoiceNumber}</span></p>
              <p>تاریخ: {toJalali(sale.date)} | ساعت: {sale.time}</p>
            </div>
          </div>

          {/* Customer Info */}
          {settings.showCustomerInfo && (
            <div className="mb-4 text-sm">
              <p><span className="font-bold">مشتری:</span> {sale.customerName}</p>
              {settings.showSellerName && <p><span className="font-bold">فروشنده:</span> {sale.sellerName}</p>}
            </div>
          )}

          {/* Items Table */}
          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="py-2 text-right">#</th>
                <th className="py-2 text-right">کالا</th>
                {settings.showIMEI && sale.items.some(i => i.imei1) && <th className="py-2 text-right">IMEI</th>}
                <th className="py-2 text-center">تعداد</th>
                <th className="py-2 text-left">قیمت</th>
                <th className="py-2 text-left">جمع</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-300">
                  <td className="py-2">{idx + 1}</td>
                  <td className="py-2">
                    <div>{item.productName}</div>
                    {item.brand && <div className="text-[10px] text-slate-500">{item.brand} {item.model}</div>}
                  </td>
                  {settings.showIMEI && sale.items.some(i => i.imei1) && <td className="py-2 font-mono text-[10px]">{item.imei1 || '-'}</td>}
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-left">{formatCurrency(item.sellPrice, settings.currency)}</td>
                  <td className="py-2 text-left font-bold">{formatCurrency(item.total, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-slate-800 pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>جمع کل:</span>
              <span>{formatCurrency(sale.subtotal, settings.currency)}</span>
            </div>
            {settings.showDiscount && sale.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>تخفیف:</span>
                <span>- {formatCurrency(sale.discount, settings.currency)}</span>
              </div>
            )}
            {settings.showTax && sale.tax > 0 && (
              <div className="flex justify-between">
                <span>مالیات:</span>
                <span>{formatCurrency(sale.tax, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-slate-400 pt-2 mt-2">
              <span>مبلغ نهایی:</span>
              <span className="text-green-700">{formatCurrency(sale.total, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>پرداخت شده:</span>
              <span>{formatCurrency(sale.paid, settings.currency)}</span>
            </div>
            {sale.remaining > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>مانده:</span>
                <span>{formatCurrency(sale.remaining, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>روش پرداخت:</span>
              <span>{sale.paymentMethod === 'cash' ? 'نقدی' : sale.paymentMethod === 'card' ? 'کارتخوان' : sale.paymentMethod === 'credit' ? 'نسیه' : 'ترکیبی'}</span>
            </div>
          </div>

          {/* Notes */}
          {settings.showNotes && sale.notes && (
            <div className="mt-4 pt-3 border-t border-slate-300 text-xs">
              <p className="font-bold">یادداشت:</p>
              <p>{sale.notes}</p>
            </div>
          )}

          {/* Footer */}
          {settings.showFooter && (
            <div className="mt-6 pt-3 border-t border-slate-300 text-center text-xs text-slate-500">
              <p>{settings.invoiceFooterText || 'از خرید شما متشکریم'}</p>
              {settings.storeDescription && <p className="mt-1">{settings.storeDescription}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

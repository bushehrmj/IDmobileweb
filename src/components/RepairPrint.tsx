import React from 'react';
import { db, type Repair } from '../lib/db';
import { formatCurrency, toJalali } from '../lib/auth';
import { Printer, X } from 'lucide-react';

interface RepairPrintProps {
  repairId: string;
  type: 'receipt' | 'invoice';
  onClose: () => void;
}

export default function RepairPrint({ repairId, type, onClose }: RepairPrintProps) {
  const repair = db.getRepair(repairId);
  const settings = db.getSettings();

  if (!repair) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-red-500">تعمیر یافت نشد</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">بستن</button>
        </div>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const statusLabels: Record<string, string> = {
    received: 'دریافت شد', waiting_check: 'در انتظار بررسی', repairing: 'در حال تعمیر',
    waiting_part: 'منتظر قطعه', ready: 'آماده تحویل', delivered: 'تحویل داده شد', cancelled: 'لغو شد',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-3 flex items-center justify-between no-print z-10">
          <h3 className="font-bold">
            {type === 'receipt' ? `رسید پذیرش #${repair.ticketNumber}` : `فاکتور تعمیر #${repair.ticketNumber}`}
          </h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
              <Printer size={14} /> چاپ
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={`p-6 ${settings.receiptPaperSize === '80mm' ? 'invoice-80mm' : settings.receiptPaperSize === 'a5' ? 'invoice-a5' : 'invoice-a4'}`} dir="rtl">
          {type === 'receipt' ? (
            <>
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
                {settings.logo && settings.showLogoOnInvoice && (
                  <img src={settings.logo} alt="Logo" className="w-12 h-12 mx-auto mb-1 object-cover" />
                )}
                <h1 className="text-lg font-bold">{settings.storeName}</h1>
                {settings.showStorePhone && settings.storePhone && <p className="text-xs">تلفن: {settings.storePhone}</p>}
                <div className="mt-2 text-sm">
                  <p className="font-bold">رسید پذیرش تعمیر</p>
                  <p>شماره: <span className="font-bold">{repair.ticketNumber}</span></p>
                  <p>تاریخ: {toJalali(repair.entryDate)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-3 text-sm space-y-1">
                <p><span className="font-bold">مشتری:</span> {repair.customerName}</p>
                <p><span className="font-bold">موبایل:</span> {repair.customerMobile}</p>
              </div>

              {/* Device Info */}
              <div className="mb-3 text-sm space-y-1 border-t border-slate-300 pt-2">
                <p className="font-bold text-center">مشخصات دستگاه</p>
                <p><span className="font-bold">دستگاه:</span> {repair.device} {repair.brand} {repair.model}</p>
                {repair.imei && <p><span className="font-bold">IMEI:</span> {repair.imei}</p>}
                {repair.color && <p><span className="font-bold">رنگ:</span> {repair.color}</p>}
                {repair.physicalCondition && <p><span className="font-bold">وضعیت ظاهری:</span> {repair.physicalCondition}</p>}
                {repair.accessories && <p><span className="font-bold">لوازم همراه:</span> {repair.accessories}</p>}
              </div>

              {/* Issue */}
              <div className="mb-3 text-sm border-t border-slate-300 pt-2">
                <p className="font-bold">ایراد اعلامی:</p>
                <p className="text-xs mt-1">{repair.reportedIssue || '-'}</p>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t-2 border-slate-800 text-center text-xs">
                <p className="font-bold">وضعیت: {statusLabels[repair.status]}</p>
                <p className="mt-2">تعمیرکار: {repair.technicianName}</p>
                {settings.showFooter && settings.invoiceFooterText && (
                  <p className="mt-2 text-slate-500">{settings.invoiceFooterText}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Invoice Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
                {settings.logo && settings.showLogoOnInvoice && (
                  <img src={settings.logo} alt="Logo" className="w-14 h-14 mx-auto mb-1 object-cover" />
                )}
                <h1 className="text-lg font-bold">{settings.storeName}</h1>
                {settings.showStorePhone && settings.storePhone && <p className="text-xs">تلفن: {settings.storePhone}</p>}
                {settings.showStoreAddress && settings.storeAddress && <p className="text-xs">{settings.storeAddress}</p>}
                <div className="mt-2 text-sm">
                  <p className="font-bold">فاکتور تعمیر</p>
                  <p>شماره: <span className="font-bold">{repair.ticketNumber}</span></p>
                  <p>تاریخ: {toJalali(repair.entryDate)} | تحویل: {repair.deliveryDate ? toJalali(repair.deliveryDate) : '-'}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-3 text-sm">
                <p><span className="font-bold">مشتری:</span> {repair.customerName} | {repair.customerMobile}</p>
                <p><span className="font-bold">دستگاه:</span> {repair.device} {repair.brand} {repair.model}</p>
              </div>

              {/* Parts Table */}
              {repair.parts.length > 0 && (
                <table className="w-full text-xs border-collapse mb-3">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-1 text-right">#</th>
                      <th className="py-1 text-right">قطعه</th>
                      <th className="py-1 text-center">تعداد</th>
                      <th className="py-1 text-left">قیمت</th>
                      <th className="py-1 text-left">جمع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repair.parts.map((part, idx) => (
                      <tr key={part.id} className="border-b border-slate-300">
                        <td className="py-1">{idx + 1}</td>
                        <td className="py-1">{part.productName}</td>
                        <td className="py-1 text-center">{part.quantity}</td>
                        <td className="py-1 text-left">{formatCurrency(part.price, settings.currency)}</td>
                        <td className="py-1 text-left font-bold">{formatCurrency(part.total, settings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Totals */}
              <div className="border-t-2 border-slate-800 pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>هزینه قطعات:</span>
                  <span>{formatCurrency(repair.partsCost, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>اجرت:</span>
                  <span>{formatCurrency(repair.labor, settings.currency)}</span>
                </div>
                {repair.extraCost > 0 && (
                  <div className="flex justify-between">
                    <span>هزینه اضافی:</span>
                    <span>{formatCurrency(repair.extraCost, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-slate-400 pt-1 mt-1">
                  <span>جمع کل:</span>
                  <span className="text-green-700">{formatCurrency(repair.totalCost, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>پرداخت شده:</span>
                  <span>{formatCurrency(repair.paid, settings.currency)}</span>
                </div>
                {repair.remaining > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>مانده:</span>
                    <span>{formatCurrency(repair.remaining, settings.currency)}</span>
                  </div>
                )}
              </div>

              {/* Diagnosis */}
              {repair.diagnosis && (
                <div className="mt-3 pt-2 border-t border-slate-300 text-xs">
                  <p className="font-bold">عیب‌یابی:</p>
                  <p>{repair.diagnosis}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-2 border-t border-slate-300 text-center text-xs text-slate-500">
                <p>تعمیرکار: {repair.technicianName}</p>
                {settings.showFooter && settings.invoiceFooterText && (
                  <p className="mt-1">{settings.invoiceFooterText}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { db, type Repair } from '../lib/db';
import { formatCurrency, toJalali } from '../lib/auth';
import { Printer, X } from 'lucide-react';

interface RepairPrintProps {
  repairId: string;
  type: 'receipt' | 'invoice';
  onClose: () => void;
}

const conditionLabels: Record<string, string> = {
  healthy: 'سالم',
  scratched: 'خط و خش',
  broken: 'شکسته',
  damaged: 'آسیب‌دیده',
  unknown: 'نامشخص',
};

const testLabels: Record<string, string> = {
  passed: '✓ سالم',
  failed: '✗ ایراد',
  not_tested: '- تست نشد',
  not_testable: '⊘ قابل تست نیست',
};

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

  const accessoriesList = [];
  if (repair.accessories?.phone) accessoriesList.push('گوشی');
  if (repair.accessories?.case) accessoriesList.push('قاب');
  if (repair.accessories?.charger) accessoriesList.push('شارژر');
  if (repair.accessories?.cable) accessoriesList.push('کابل');
  if (repair.accessories?.simCard) accessoriesList.push('سیم‌کارت');
  if (repair.accessories?.memoryCard) accessoriesList.push('کارت حافظه');
  if (repair.accessories?.headphones) accessoriesList.push('هدفون');
  if (repair.accessories?.box) accessoriesList.push('جعبه');
  if (repair.accessories?.other && repair.accessories.otherDescription) accessoriesList.push(repair.accessories.otherDescription);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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

        <div className="p-8" dir="rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif' }}>
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
            {settings.logo && settings.showLogoOnInvoice && (
              <img src={settings.logo} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-cover" />
            )}
            <h1 className="text-xl font-bold">{settings.storeName}</h1>
            {settings.showStorePhone && settings.storePhone && <p className="text-xs">تلفن: {settings.storePhone}</p>}
            {settings.showStoreAddress && settings.storeAddress && <p className="text-xs">{settings.storeAddress}</p>}
            <div className="mt-3">
              <p className="font-bold text-lg">رسید پذیرش تعمیرات</p>
              <p className="text-sm mt-1">شماره پذیرش: <span className="font-mono font-bold">{repair.ticketNumber}</span></p>
              <p className="text-xs">تاریخ: {toJalali(repair.entryDate)} | ساعت: {repair.entryTime}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-4 text-sm">
            <h2 className="font-bold border-b border-slate-300 pb-1 mb-2">اطلاعات مشتری</h2>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-bold">نام:</span> {repair.customerName}</p>
              <p><span className="font-bold">موبایل:</span> {repair.customerMobile}</p>
              {repair.customerMobile2 && <p><span className="font-bold">تماس دوم:</span> {repair.customerMobile2}</p>}
              {repair.customerNationalId && <p><span className="font-bold">کد ملی:</span> {repair.customerNationalId}</p>}
            </div>
          </div>

          {/* Device Info */}
          <div className="mb-4 text-sm">
            <h2 className="font-bold border-b border-slate-300 pb-1 mb-2">مشخصات دستگاه</h2>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-bold">نوع:</span> {repair.deviceType === 'mobile' ? 'موبایل' : repair.deviceType === 'tablet' ? 'تبلت' : repair.deviceType}</p>
              <p><span className="font-bold">برند:</span> {repair.brand}</p>
              <p><span className="font-bold">مدل:</span> {repair.model}</p>
              {repair.color && <p><span className="font-bold">رنگ:</span> {repair.color}</p>}
              {repair.storage && <p><span className="font-bold">حافظه:</span> {repair.storage}</p>}
              {repair.ram && <p><span className="font-bold">RAM:</span> {repair.ram}</p>}
              {repair.imei && <p><span className="font-bold">IMEI 1:</span> <span className="font-mono">{repair.imei}</span></p>}
              {repair.imei2 && <p><span className="font-bold">IMEI 2:</span> <span className="font-mono">{repair.imei2}</span></p>}
              {repair.serial && <p><span className="font-bold">Serial:</span> <span className="font-mono">{repair.serial}</span></p>}
            </div>
          </div>

          {/* Accessories */}
          {accessoriesList.length > 0 && (
            <div className="mb-4 text-sm">
              <h2 className="font-bold border-b border-slate-300 pb-1 mb-2">اقلام تحویلی همراه دستگاه</h2>
              <p>{accessoriesList.join('، ')}</p>
            </div>
          )}

          {/* Reported Issue */}
          <div className="mb-4 text-sm">
            <h2 className="font-bold border-b border-slate-300 pb-1 mb-2">ایراد اعلامی مشتری</h2>
            <p className="bg-slate-50 p-2 rounded">{repair.reportedIssue}</p>
          </div>

          {/* Requested Services */}
          {repair.requestedServices && repair.requestedServices.length > 0 && (
            <div className="mb-4 text-sm">
              <h2 className="font-bold border-b border-slate-300 pb-1 mb-2">خدمات درخواستی</h2>
              <p>{repair.requestedServices.join('، ')}</p>
            </div>
          )}

          {/* Cost Estimate */}
          {type === 'invoice' && (
            <div className="mb-4 text-sm">
              <h2 className="font-bold border-b border-slate-300 pb-1 mb-2">هزینه</h2>
              <div className="space-y-1">
                {repair.parts && repair.parts.length > 0 && (
                  <>
                    <p className="font-bold">قطعات مصرفی:</p>
                    {repair.parts.map((part, idx) => (
                      <div key={idx} className="flex justify-between pr-4">
                        <span>{part.productName} × {part.quantity}</span>
                        <span>{formatCurrency(part.total, settings.currency)}</span>
                      </div>
                    ))}
                  </>
                )}
                {repair.labor > 0 && (
                  <div className="flex justify-between">
                    <span>اجرت تعمیر</span>
                    <span>{formatCurrency(repair.labor, settings.currency)}</span>
                  </div>
                )}
                {repair.extraCost > 0 && (
                  <div className="flex justify-between">
                    <span>سایر هزینه‌ها</span>
                    <span>{formatCurrency(repair.extraCost, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-slate-400 pt-1 mt-1">
                  <span>جمع کل:</span>
                  <span>{formatCurrency(repair.finalTotal || repair.totalCost, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>پرداخت شده:</span>
                  <span>{formatCurrency(repair.paid, settings.currency)}</span>
                </div>
                {(repair.remaining || 0) > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>مانده:</span>
                    <span>{formatCurrency(repair.remaining, settings.currency)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          {repair.estimatedDeliveryDate && (
            <div className="mb-4 text-sm">
              <p><span className="font-bold">زمان تقریبی آماده‌شدن:</span> {toJalali(repair.estimatedDeliveryDate)}</p>
              <p className="text-xs text-slate-500 mt-1">
                (این زمان تقریبی است و ممکن است با توجه به تأمین قطعه تغییر کند)
              </p>
            </div>
          )}

          {/* Warnings */}
          <div className="mb-4 text-xs">
            <h2 className="font-bold border-b border-slate-300 pb-1 mb-2">شرایط و هشدارها</h2>
            <div className="space-y-1">
              {repair.warnings?.dataBackupWarning && (
                <p>• مشتری توصیه می‌شود پیش از تحویل دستگاه، از اطلاعات شخصی و مهم خود نسخه پشتیبان تهیه کند.</p>
              )}
              {repair.warnings?.waterDamageWarning && (
                <p className="text-orange-700">• با توجه به آثار رطوبت یا آب‌خوردگی، نتیجه تعمیر و دوام قطعات قابل تضمین قطعی نیست.</p>
              )}
              {repair.warnings?.previouslyOpenedWarning && (
                <p>• دستگاه دارای سابقه بازشدگی/تعمیر قبلی است.</p>
              )}
              {repair.warnings?.boardRepairWarning && (
                <p>• در تعمیرات برد، نتیجه نهایی پس از عیب‌یابی و انجام تست مشخص می‌شود.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t-2 border-slate-800 text-center text-xs text-slate-600">
            <p>این رسید، مستند پذیرش و وضعیت ثبت‌شده دستگاه در زمان تحویل به مرکز تعمیرات است.</p>
            <p className="mt-1">شرایط خدمات و گارانتی مطابق موارد درج‌شده در همین رسید و مقررات جاری خواهد بود.</p>
            <p className="mt-2 font-mono">شماره پذیرش: {repair.ticketNumber} | تاریخ: {toJalali(repair.entryDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

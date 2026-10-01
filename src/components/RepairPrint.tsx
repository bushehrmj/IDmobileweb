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
  let repair = db.getRepair(repairId);
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

  // Migration: Add missing fields for old repairs
  if (!repair.accessories) {
    repair = {
      ...repair,
      accessories: {
        phone: true,
        case: false,
        charger: false,
        cable: false,
        simCard: false,
        memoryCard: false,
        stylus: false,
        headphones: false,
        box: false,
        other: false,
      },
    };
  }
  if (!repair.confirmations) {
    repair = {
      ...repair,
      confirmations: {
        conditionChecked: false,
        accessoriesRegistered: false,
        issueReported: false,
        costEstimated: false,
        dataLossInformed: false,
        warrantyInformed: false,
        receiptReceived: false,
        serviceAgreed: false,
      },
    };
  }
  if (!repair.warnings) {
    repair = {
      ...repair,
      warnings: {
        dataBackupWarning: true,
        waterDamageWarning: false,
        boardRepairWarning: false,
        previouslyOpenedWarning: false,
        partsAvailabilityWarning: false,
      },
    };
  }

  const handlePrint = () => window.print();

  // Safe accessors
  const accessoriesList: string[] = [];
  if (repair.accessories) {
    if (repair.accessories.phone) accessoriesList.push('گوشی');
    if (repair.accessories.case) accessoriesList.push('قاب');
    if (repair.accessories.charger) accessoriesList.push('شارژر');
    if (repair.accessories.cable) accessoriesList.push('کابل');
    if (repair.accessories.simCard) accessoriesList.push('سیم‌کارت');
    if (repair.accessories.memoryCard) accessoriesList.push('کارت حافظه');
    if (repair.accessories.headphones) accessoriesList.push('هدفون');
    if (repair.accessories.box) accessoriesList.push('جعبه');
    if (repair.accessories.other && repair.accessories.otherDescription) accessoriesList.push(repair.accessories.otherDescription);
  } else if (repair.accessories && typeof repair.accessories === 'string') {
    // Legacy format
    accessoriesList.push(repair.accessories as string);
  }

  const deviceTypeLabel = repair.deviceType === 'mobile' ? 'موبایل' : 
                          repair.deviceType === 'tablet' ? 'تبلت' : 
                          repair.deviceType === 'watch' ? 'ساعت' :
                          repair.deviceType === 'laptop' ? 'لپ‌تاپ' : 
                          repair.deviceType || 'دستگاه';

  const totalCost = repair.finalTotal || repair.totalCost || 0;
  const paid = repair.paid || 0;
  const remaining = repair.remaining || 0;

  // Single receipt content for duplication
  const renderReceiptContent = () => (
    <div className="p-4" dir="rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
        {settings.logo && settings.showLogoOnInvoice && (
          <img src={settings.logo} alt="Logo" className="w-12 h-12 mx-auto mb-1 object-cover" />
        )}
        <h1 className="text-base font-bold">{settings.storeName}</h1>
        {settings.showStorePhone && settings.storePhone && <p className="text-[10px]">تلفن: {settings.storePhone}</p>}
        {settings.showStoreAddress && settings.storeAddress && <p className="text-[10px]">{settings.storeAddress}</p>}
        <div className="mt-2">
          {type === 'receipt' ? (
            <>
              <p className="font-bold text-sm">رسید پذیرش تعمیرات</p>
              <p className="text-[9px] text-slate-600">مستند وضعیت دستگاه در زمان تحویل به مرکز</p>
            </>
          ) : (
            <>
              <p className="font-bold text-sm">فاکتور خدمات تعمیرات</p>
              <p className="text-[9px] text-slate-600">صورتحساب نهایی خدمات</p>
            </>
          )}
          <p className="text-xs mt-1">شماره: <span className="font-mono font-bold">{repair.ticketNumber}</span></p>
          <p className="text-[10px]">تاریخ: {toJalali(repair.entryDate)} {repair.entryTime && `| ساعت: ${repair.entryTime}`}</p>
          {repair.deliveryDate && <p className="text-[10px]">تحویل: {toJalali(repair.deliveryDate)}</p>}
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-2 text-[11px]">
        <h2 className="font-bold border-b border-slate-300 pb-0.5 mb-1">مشتری</h2>
        <div className="grid grid-cols-2 gap-1">
          <p><span className="font-bold">نام:</span> {repair.customerName || '-'}</p>
          <p><span className="font-bold">موبایل:</span> {repair.customerMobile || '-'}</p>
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-2 text-[11px]">
        <h2 className="font-bold border-b border-slate-300 pb-0.5 mb-1">دستگاه</h2>
        <div className="grid grid-cols-2 gap-1">
          <p><span className="font-bold">نوع:</span> {deviceTypeLabel}</p>
          <p><span className="font-bold">برند:</span> {repair.brand || '-'}</p>
          <p><span className="font-bold">مدل:</span> {repair.model || repair.device || '-'}</p>
          {repair.color && <p><span className="font-bold">رنگ:</span> {repair.color}</p>}
          {repair.imei && <p className="col-span-2"><span className="font-bold">IMEI:</span> <span className="font-mono">{repair.imei}</span></p>}
        </div>
      </div>

      {/* Accessories */}
      {accessoriesList.length > 0 && (
        <div className="mb-2 text-[11px]">
          <h2 className="font-bold border-b border-slate-300 pb-0.5 mb-1">اقلام همراه</h2>
          <p>{accessoriesList.join('، ')}</p>
        </div>
      )}

      {/* Reported Issue */}
      {repair.reportedIssue && (
        <div className="mb-2 text-[11px]">
          <h2 className="font-bold border-b border-slate-300 pb-0.5 mb-1">ایراد اعلامی</h2>
          <p className="bg-slate-50 p-1 rounded text-[10px]">{repair.reportedIssue}</p>
        </div>
      )}

      {/* Requested Services */}
      {repair.requestedServices && repair.requestedServices.length > 0 && (
        <div className="mb-2 text-[11px]">
          <h2 className="font-bold border-b border-slate-300 pb-0.5 mb-1">خدمات درخواستی</h2>
          <p>{repair.requestedServices.join('، ')}</p>
        </div>
      )}

      {/* Invoice Only - Cost Details */}
      {type === 'invoice' && (
        <div className="mb-2 text-[11px]">
          <h2 className="font-bold border-b border-slate-300 pb-0.5 mb-1">هزینه</h2>
          <div className="space-y-0.5">
            {repair.parts && repair.parts.length > 0 && (
              <>
                <p className="font-bold">قطعات:</p>
                {repair.parts.map((part, idx) => (
                  <div key={idx} className="flex justify-between pr-2 text-[10px]">
                    <span>{part.productName} × {part.quantity}</span>
                    <span>{formatCurrency(part.total, settings.currency)}</span>
                  </div>
                ))}
              </>
            )}
            {(repair.labor || 0) > 0 && (
              <div className="flex justify-between">
                <span>اجرت</span>
                <span>{formatCurrency(repair.labor || 0, settings.currency)}</span>
              </div>
            )}
            {(repair.extraCost || 0) > 0 && (
              <div className="flex justify-between">
                <span>سایر</span>
                <span>{formatCurrency(repair.extraCost || 0, settings.currency)}</span>
              </div>
            )}
            {(repair.discount || 0) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>تخفیف</span>
                <span>- {formatCurrency(repair.discount || 0, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-slate-400 pt-0.5 mt-0.5">
              <span>جمع کل:</span>
              <span>{formatCurrency(totalCost, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>پرداخت:</span>
              <span>{formatCurrency(paid, settings.currency)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>مانده:</span>
                <span>{formatCurrency(remaining, settings.currency)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagnosis (Invoice only) */}
      {type === 'invoice' && repair.diagnosis && (
        <div className="mb-2 text-[11px]">
          <h2 className="font-bold border-b border-slate-300 pb-0.5 mb-1">تشخیص/عیب‌یابی</h2>
          <p className="text-[10px]">{repair.diagnosis}</p>
        </div>
      )}

      {/* Estimated Delivery */}
      {repair.estimatedDeliveryDate && (
        <div className="mb-2 text-[10px]">
          <p><span className="font-bold">موعد تقریبی:</span> {toJalali(repair.estimatedDeliveryDate)}</p>
        </div>
      )}

      {/* Warnings */}
      {repair.warnings && (
        <div className="mb-2 text-[9px]">
          {repair.warnings.dataBackupWarning && (
            <p>• توصیه به تهیه نسخه پشتیبان از اطلاعات</p>
          )}
          {repair.warnings.waterDamageWarning && (
            <p className="text-orange-700">• هشدار آب‌خوردگی - نتیجه قابل تضمین قطعی نیست</p>
          )}
          {repair.warnings.previouslyOpenedWarning && (
            <p>• دستگاه سابقه بازشدگی قبلی دارد</p>
          )}
          {repair.warnings.boardRepairWarning && (
            <p>• تعمیر برد - نتیجه پس از عیب‌یابی مشخص می‌شود</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2 border-t-2 border-slate-800 text-center text-[9px] text-slate-600">
        {type === 'receipt' ? (
          <>
            <p className="font-bold">رسید پذیرش تعمیرات</p>
            <p>این رسید مستند وضعیت دستگاه در زمان تحویل است.</p>
            <p>لطفاً تا زمان تحویل دستگاه نزد خود نگهداری نمایید.</p>
          </>
        ) : (
          <>
            <p className="font-bold">فاکتور خدمات تعمیرات</p>
            <p>صورتحساب نهایی خدمات انجام‌شده</p>
            <p>از اعتماد شما سپاسگزاریم</p>
          </>
        )}
        <p className="mt-1 font-mono">شماره: {repair.ticketNumber} | تاریخ: {toJalali(repair.entryDate)}</p>
      </div>
    </div>
  );

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

        {/* Two copies on A5 - for receipt */}
        {type === 'receipt' ? (
          <div className="print-a5-dual">
            {/* Copy 1 - Customer */}
            <div className="receipt-copy border-b-2 border-dashed border-slate-400">
              <div className="text-center text-[9px] text-slate-500 py-0.5 bg-slate-100">
                نسخه مشتری
              </div>
              {renderReceiptContent()}
            </div>
            
            {/* Copy 2 - Store */}
            <div className="receipt-copy">
              <div className="text-center text-[9px] text-slate-500 py-0.5 bg-slate-100">
                نسخه فروشگاه
              </div>
              {renderReceiptContent()}
            </div>
          </div>
        ) : (
          // Invoice - single copy
          <div>
            {renderReceiptContent()}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { db, type Repair } from '../lib/db';
import { formatCurrency, toJalali } from '../lib/auth';
import { Printer, X } from 'lucide-react';
import PrintCenter from './PrintCenter';

interface RepairPrintProps {
  repairId: string;
  type: 'receipt' | 'invoice';
  onClose: () => void;
}

export default function RepairPrint({ repairId, type, onClose }: RepairPrintProps) {
  const repair = db.getRepair(repairId);
  const settings = db.getSettings();
  const [showPrintCenter, setShowPrintCenter] = useState(false);

  // اگر تعمیر پیدا نشد
  if (!repair) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-red-500 mb-4">تعمیر یافت نشد</p>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            بستن
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setShowPrintCenter(true);
  };

  // Safe accessors with defaults
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
    if (repair.accessories.other && repair.accessories.otherDescription) {
      accessoriesList.push(repair.accessories.otherDescription);
    }
  }

  const deviceTypeLabel = repair.deviceType === 'mobile' ? 'موبایل' : 
                          repair.deviceType === 'tablet' ? 'تبلت' : 
                          repair.deviceType === 'watch' ? 'ساعت' :
                          repair.deviceType === 'laptop' ? 'لپ‌تاپ' : 
                          repair.deviceType || 'دستگاه';

  const totalCost = repair.finalTotal || repair.totalCost || 0;

  // رسید استاندارد اتحادیه
  const renderUnionReceipt = () => (
    <div 
      className="p-4 bg-white text-black" 
      dir="rtl" 
      style={{ 
        fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif', 
        fontSize: '11px',
        lineHeight: '1.6'
      }}
    >
      {/* هدر اتحادیه */}
      <div className="text-center border-2 border-black p-3 mb-3">
        <h1 className="text-base font-bold mb-1">مورد تایید اتحادیه</h1>
        <h2 className="text-sm font-bold">(در دو نسخه) تلفن همراه</h2>
        <h3 className="text-sm font-bold mt-1">قبض رسید تعمیرات</h3>
      </div>

      {/* اطلاعات فروشگاه */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <span className="font-bold">تلفن تماس:</span> {settings.storePhone || '....................'}
        </div>
        <div className="text-left">
          <span className="font-bold">آدرس فروشگاه:</span> {settings.storeAddress || '....................'}
        </div>
      </div>

      {/* اطلاعات قبض */}
      <div className="border-2 border-black p-2 mb-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="font-bold">شماره قبض:</span> {repair.ticketNumber}
          </div>
          <div>
            <span className="font-bold">تاریخ:</span> {toJalali(repair.entryDate)}
          </div>
          <div>
            <span className="font-bold">ساعت:</span> {repair.entryTime || '--:--'}
          </div>
        </div>
      </div>

      {/* اطلاعات مشتری */}
      <div className="border-2 border-black p-2 mb-3">
        <h4 className="font-bold mb-1 text-xs">اطلاعات مشتری</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-bold">نام و نام خانوادگی:</span> {repair.customerName}
          </div>
          <div>
            <span className="font-bold">شماره ملی:</span> {repair.customerNationalId || '................'}
          </div>
          <div>
            <span className="font-bold">شماره تلفن همراه:</span> {repair.customerMobile}
          </div>
          <div>
            <span className="font-bold">شماره تلفن ثابت:</span> {repair.customerMobile2 || '................'}
          </div>
        </div>
      </div>

      {/* مشخصات دستگاه */}
      <div className="border-2 border-black p-2 mb-3">
        <h4 className="font-bold mb-1 text-xs">مشخصات دستگاه</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-bold">برند و مدل:</span> {repair.brand} {repair.model}
          </div>
          <div>
            <span className="font-bold">رنگ:</span> {repair.color || '........'}
          </div>
          <div>
            <span className="font-bold">شماره سریال:</span> {repair.serial || '................'}
          </div>
          <div>
            <span className="font-bold">IMEI:</span> {repair.imei || '................'}
          </div>
        </div>
      </div>

      {/* ایراد دستگاه */}
      <div className="border-2 border-black p-2 mb-3">
        <h4 className="font-bold mb-1 text-xs">ایراد اعلامی مشتری</h4>
        <p className="text-xs min-h-[30px]">{repair.reportedIssue || '........................................................'}</p>
      </div>

      {/* وضعیت ظاهری */}
      <div className="border-2 border-black p-2 mb-3">
        <h4 className="font-bold mb-1 text-xs">ایرادات ظاهری دستگاه</h4>
        <p className="text-xs min-h-[20px]">
          {repair.physicalCondition ? 
            Object.entries(repair.physicalCondition)
              .filter(([key, value]) => value !== 'unknown' && value !== false)
              .map(([key]) => {
                const labels: Record<string, string> = {
                  screen: 'صفحه نمایش',
                  backCover: 'قاب پشت',
                  frame: 'فریم',
                  edges: 'لبه‌ها',
                  camera: 'دوربین',
                  waterDamage: 'آب‌خوردگی',
                  impactDamage: 'ضربه‌خوردگی',
                };
                return labels[key] || key;
              })
              .join('، ') || '........................................................'
            : '........................................................'}
        </p>
      </div>

      {/* لوازم همراه */}
      <div className="border-2 border-black p-2 mb-3">
        <h4 className="font-bold mb-1 text-xs">لوازم و متعلقات همراه دستگاه</h4>
        <p className="text-xs min-h-[20px]">
          {accessoriesList.length > 0 ? accessoriesList.join('، ') : '........................................................'}
        </p>
      </div>

      {/* هزینه و زمان */}
      <div className="border-2 border-black p-2 mb-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-bold">هزینه برآورد اولیه:</span> {formatCurrency(repair.estimatedTotal || totalCost, settings.currency)}
          </div>
          <div>
            <span className="font-bold">زمان تقریبی تعمیر:</span> {repair.estimatedDeliveryDate ? toJalali(repair.estimatedDeliveryDate) : '72 ساعت'}
          </div>
        </div>
      </div>

      {/* قوانین اتحادیه */}
      <div className="border-2 border-black p-2 mb-3 text-xs">
        <h4 className="font-bold mb-1">شرایط و قوانین (مورد تایید اتحادیه)</h4>
        <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
          <li>دستگاه بنا به مورد تعمیر و عیب رفع شده طبق قانون دارای گارانتی می‌باشد.</li>
          <li>در صورت نیاز به فلش یا ریستور و پاک شدن اطلاعات به هنگام تعمیر، تعمیرگاه هیچگونه مسئولیتی ندارد و حفظ و نگهداری اطلاعات شخصی به عهده مالک دستگاه می‌باشد.</li>
          <li>احتمال شکستگی و از کار افتادن صفحه نمایش به هنگام تعمیر در توضیحات مکتوب می‌گردد.</li>
          <li>در صورت نصب قطعات غیر اصلی، بایستی به صورت مکتوب در توضیحات قبض با توافق مشتری ذکر گردد.</li>
          <li>زمان تقریبی تعمیر دستگاه 72 ساعت می‌باشد و در صورت طولانی‌تر شدن زمان، با مشتری توافق می‌گردد.</li>
          <li>در ارتباط با گوشی‌های آب‌دیده و ضربه‌خورده و یا دارای شرایط خاص نرم‌افزاری و سخت‌افزاری، شرط خاموشی (مرگ کامل دستگاه) در توضیحات مکتوب می‌گردد.</li>
          <li>در شرایطی که ایراد دستگاه خاموشی باشد، پس از رفع عیب و بروز عیوب ثانویه، هزینه تعمیر باید پس از توافق با مشتری دریافت گردد.</li>
          <li>در شرایطی که ایراد دستگاه از کار افتادگی صفحه نمایش باشد، تعمیرکار باید قبل از نصب صفحه نمایش دستگاه را کاملاً تست نماید و پس از رویت عیوب ثانویه، هزینه تعمیر ایراد ثانویه پس از توافق با مشتری جداگانه دریافت گردد.</li>
          <li>در ارتباط با هزینه تعمیرات در صورت موارد خاص و دریافت اجرت بالاتر از نرخ‌نامه اتحادیه، توافق در توضیحات مکتوب می‌گردد.</li>
          <li>در صورت مفقود شدن قبض رسید، دستگاه فقط به مالک یا آورنده تحویل می‌گردد. مشتری بایستی بلافاصله مرکز تعمیرات را مطلع نماید در غیر اینصورت کلیه عواقب به عهده مالک می‌باشد.</li>
          <li>حداکثر زمان نگهداری دستگاه پس از تعمیر و اعلام به مشتری در محل تعمیرگاه یکماه می‌باشد و بعد از این مدت در صورت رخ دادن آتش‌سوزی، زلزله و ... تعمیرگاه هیچگونه مسئولیتی ندارد.</li>
        </ol>
      </div>

      {/* توضیحات */}
      <div className="border-2 border-black p-2 mb-3">
        <h4 className="font-bold mb-1 text-xs">توضیحات</h4>
        <p className="text-xs min-h-[40px]">
          {repair.notes || '................................................................................................................................................................'}
        </p>
      </div>

      {/* امضاها */}
      <div className="border-2 border-black p-2 mb-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="text-center">
            <p className="font-bold mb-6">امضاء مشتری</p>
            <div className="border-b border-black h-8"></div>
            <p className="mt-1 text-[10px]">صحت موارد فوق و به صورت کتبی و شفاهی به اینجانب تفهیم و رفع ابهام گردید. اینجانب ........................ تائید می‌نمایم.</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-6">مهر و امضاء فروشگاه</p>
            <div className="border-b border-black h-8"></div>
          </div>
        </div>
      </div>

      {/* پاورقی */}
      <div className="text-center text-[10px] border-t-2 border-black pt-2">
        <p className="font-bold">این رسید در دو برگ مجزا و یکسان صادر شده است</p>
        <p className="mt-1">قبض رسید مورد تایید اتحادیه می‌باشد</p>
      </div>
    </div>
  );

  // محتوای رسید برای چاپ
  const receiptContent = (
    <div>
      {/* نسخه اول */}
      {renderUnionReceipt()}
      
      {/* خط برش */}
      <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
      
      {/* نسخه دوم */}
      {renderUnionReceipt()}
    </div>
  );

  return (
    <>
      {/* Modal پیش‌نمایش */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-3 flex items-center justify-between z-10">
            <h3 className="font-bold text-lg">
              {type === 'receipt' ? `قبض رسید تعمیرات #${repair.ticketNumber}` : `فاکتور تعمیر #${repair.ticketNumber}`}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700"
              >
                <Printer size={16} />
                چاپ
              </button>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
            {receiptContent}
          </div>
        </div>
      </div>

      {/* Print Center */}
      {showPrintCenter && (
        <PrintCenter
          isOpen={showPrintCenter}
          onClose={() => setShowPrintCenter(false)}
          content={receiptContent}
          documentType="repair-receipt"
          documentTitle={`قبض رسید تعمیرات ${repair.ticketNumber}`}
        />
      )}
    </>
  );
}

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

  const handlePrint = () => setShowPrintCenter(true);

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
  const paid = repair.paid || 0;
  const remaining = repair.remaining || 0;

  // رسید استاندارد اتحادیه
  const renderUnionReceipt = () => (
    <div className="p-6" dir="rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif', fontSize: '11px' }}>
      {/* هدر اتحادیه */}
      <div className="text-center border-2 border-black p-3 mb-4">
        <h1 className="text-lg font-bold mb-1">مورد تایید اتحادیه</h1>
        <h2 className="text-base font-bold">(در دو نسخه) تلفن همراه</h2>
        <h3 className="text-sm font-bold mt-2">قبض رسید تعمیرات</h3>
      </div>

      {/* اطلاعات فروشگاه */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="font-bold">تلفن تماس: {settings.storePhone || '....................'}</p>
        </div>
        <div className="text-left">
          <p className="font-bold">آدرس فروشگاه: {settings.storeAddress || '....................'}</p>
        </div>
      </div>

      {/* اطلاعات قبض */}
      <div className="border-2 border-black p-3 mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-bold">شماره قبض:</span>
            <span className="mr-2">{repair.ticketNumber}</span>
          </div>
          <div>
            <span className="font-bold">تاریخ:</span>
            <span className="mr-2">{toJalali(repair.entryDate)}</span>
          </div>
          <div>
            <span className="font-bold">ساعت:</span>
            <span className="mr-2">{repair.entryTime || '--:--'}</span>
          </div>
        </div>
      </div>

      {/* اطلاعات مشتری */}
      <div className="border-2 border-black p-3 mb-4">
        <h4 className="font-bold mb-2 text-sm">اطلاعات مشتری</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold">نام و نام خانوادگی:</span>
            <span className="mr-2 border-b border-black inline-block w-40">{repair.customerName}</span>
          </div>
          <div>
            <span className="font-bold">شماره ملی:</span>
            <span className="mr-2 border-b border-black inline-block w-40">{repair.customerNationalId || '................'}</span>
          </div>
          <div>
            <span className="font-bold">شماره تلفن همراه:</span>
            <span className="mr-2 border-b border-black inline-block w-40">{repair.customerMobile}</span>
          </div>
          <div>
            <span className="font-bold">شماره تلفن ثابت:</span>
            <span className="mr-2 border-b border-black inline-block w-40">................</span>
          </div>
        </div>
      </div>

      {/* اطلاعات دستگاه */}
      <div className="border-2 border-black p-3 mb-4">
        <h4 className="font-bold mb-2 text-sm">مشخصات دستگاه</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold">برند و مدل:</span>
            <span className="mr-2 border-b border-black inline-block w-40">{repair.brand} {repair.model}</span>
          </div>
          <div>
            <span className="font-bold">رنگ:</span>
            <span className="mr-2 border-b border-black inline-block w-40">{repair.color || '........'}</span>
          </div>
          <div>
            <span className="font-bold">شماره سریال:</span>
            <span className="mr-2 border-b border-black inline-block w-40 font-mono">{repair.serial || '................'}</span>
          </div>
          <div>
            <span className="font-bold">IMEI:</span>
            <span className="mr-2 border-b border-black inline-block w-40 font-mono">{repair.imei || '................'}</span>
          </div>
        </div>
      </div>

      {/* ایراد دستگاه */}
      <div className="border-2 border-black p-3 mb-4">
        <h4 className="font-bold mb-2 text-sm">ایراد اعلامی مشتری</h4>
        <p className="text-xs min-h-[40px] border-b border-black">{repair.reportedIssue || '........................................................'}</p>
      </div>

      {/* وضعیت ظاهری */}
      <div className="border-2 border-black p-3 mb-4">
        <h4 className="font-bold mb-2 text-sm">ایرادات ظاهری دستگاه</h4>
        <p className="text-xs min-h-[30px] border-b border-black">
          {repair.physicalCondition ? 
            Object.entries(repair.physicalCondition)
              .filter(([key, value]) => value !== 'unknown' && value !== false)
              .map(([key, value]) => {
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
      <div className="border-2 border-black p-3 mb-4">
        <h4 className="font-bold mb-2 text-sm">لوازم و متعلقات همراه دستگاه</h4>
        <p className="text-xs min-h-[30px] border-b border-black">
          {accessoriesList.length > 0 ? accessoriesList.join('، ') : '........................................................'}
        </p>
      </div>

      {/* هزینه و زمان */}
      <div className="border-2 border-black p-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold">هزینه برآورد اولیه:</span>
            <span className="mr-2 border-b border-black inline-block w-32 text-left">
              {formatCurrency(repair.estimatedTotal || totalCost, settings.currency)}
            </span>
          </div>
          <div>
            <span className="font-bold">زمان تقریبی تعمیر:</span>
            <span className="mr-2 border-b border-black inline-block w-32 text-left">
              {repair.estimatedDeliveryDate ? toJalali(repair.estimatedDeliveryDate) : '72 ساعت'}
            </span>
          </div>
        </div>
      </div>

      {/* قوانین و مقررات اتحادیه */}
      <div className="border-2 border-black p-3 mb-4 text-xs">
        <h4 className="font-bold mb-2">شرایط و قوانین (مورد تایید اتحادیه)</h4>
        <ol className="list-decimal list-inside space-y-1 leading-relaxed">
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

      {/* توضیحات اضافی */}
      <div className="border-2 border-black p-3 mb-4">
        <h4 className="font-bold mb-2 text-sm">توضیحات</h4>
        <p className="text-xs min-h-[60px] border-b border-black">
          {repair.notes || '....................................................................................................................................................................................................................................................................................................................................................'}
        </p>
      </div>

      {/* امضاها */}
      <div className="border-2 border-black p-3 mb-4">
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div className="text-center">
            <p className="font-bold mb-8">امضاء مشتری</p>
            <p className="border-b border-black inline-block w-48"></p>
            <p className="mt-2 text-[10px]">صحت موارد فوق و به صورت کتبی و شفاهی به اینجانب تفهیم و رفع ابهام گردید. اینجانب .................................... تائید می‌نمایم.</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-8">مهر و امضاء فروشگاه</p>
            <p className="border-b border-black inline-block w-48"></p>
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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 p-3 flex items-center justify-between no-print z-10">
            <h3 className="font-bold">
              {type === 'receipt' ? `قبض رسید تعمیرات #${repair.ticketNumber}` : `فاکتور تعمیر #${repair.ticketNumber}`}
            </h3>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
                <Printer size={14} /> چاپ حرفه‌ای
              </button>
              <button onClick={onClose} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* دو نسخه از رسید */}
          <div className="print-two-copies">
            {/* نسخه اول */}
            <div className="receipt-copy">
              {renderUnionReceipt()}
            </div>

            {/* خط برش */}
            <div className="border-t-2 border-dashed border-gray-400 my-4 print:my-8"></div>

            {/* نسخه دوم */}
            <div className="receipt-copy">
              {renderUnionReceipt()}
            </div>
          </div>
        </div>
      </div>

      {/* Print Center */}
      {showPrintCenter && (
        <PrintCenter
          isOpen={showPrintCenter}
          onClose={() => setShowPrintCenter(false)}
          content={
            <div className="print-two-copies">
              <div className="receipt-copy">
                {renderUnionReceipt()}
              </div>
              <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
              <div className="receipt-copy">
                {renderUnionReceipt()}
              </div>
            </div>
          }
          documentType="repair-receipt"
          documentTitle={`قبض رسید تعمیرات ${repair.ticketNumber}`}
        />
      )}
    </>
  );
}

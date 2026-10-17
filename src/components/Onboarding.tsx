import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import Button from '../components/ui/Button';
import { 
  CheckCircle, ArrowLeft, ArrowRight, ShoppingCart, Wrench, 
  Package, Users, DollarSign, FileText, Settings, X
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'خوش آمدید به ID Mobile Manager Pro',
      description: 'سیستم مدیریت حرفه‌ای فروشگاه موبایل',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      content: (
        <div className="text-center space-y-4">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            سلام {user?.fullName}! 👋
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            این راهنما به شما کمک می‌کند تا با ویژگی‌های اصلی سیستم آشنا شوید
          </p>
        </div>
      ),
    },
    {
      title: 'مدیریت فروش',
      description: 'ثبت فاکتور، مدیریت محصولات و مشتریان',
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <CheckCircle size={20} className="text-green-600 mt-1" />
            <div>
              <p className="font-bold text-green-900 dark:text-green-300">ثبت فروش سریع</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                با اسکن بارکد یا جستجو، محصولات را به سبد اضافه کنید
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <CheckCircle size={20} className="text-green-600 mt-1" />
            <div>
              <p className="font-bold text-green-900 dark:text-green-300">تسویه خودکار</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                با یک کلیک، مبلغ پرداختی را برابر مبلغ نهایی کنید
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <CheckCircle size={20} className="text-green-600 mt-1" />
            <div>
              <p className="font-bold text-green-900 dark:text-green-300">چاپ فاکتور</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                فاکتور را در سایزهای مختلف (80mm, A5, A4) چاپ کنید
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'مدیریت تعمیرات',
      description: 'پذیرش، پیگیری و تحویل دستگاه‌ها',
      icon: Wrench,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <CheckCircle size={20} className="text-purple-600 mt-1" />
            <div>
              <p className="font-bold text-purple-900 dark:text-purple-300">پذیرش سریع</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                اطلاعات مشتری، دستگاه و ایراد را در یک فرم ثبت کنید
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <CheckCircle size={20} className="text-purple-600 mt-1" />
            <div>
              <p className="font-bold text-purple-900 dark:text-purple-300">مدیریت قطعات</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                قطعات را از انبار جستجو یا دستی اضافه کنید
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <CheckCircle size={20} className="text-purple-600 mt-1" />
            <div>
              <p className="font-bold text-purple-900 dark:text-purple-300">چاپ رسید و فاکتور</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                رسید پذیرش و فاکتور نهایی را چاپ کنید
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'مدیریت انبار',
      description: 'کنترل موجودی و حرکات انبار',
      icon: Package,
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <CheckCircle size={20} className="text-amber-600 mt-1" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-300">مشاهده موجودی</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                لیست کامل محصولات با موجودی فعلی
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <CheckCircle size={20} className="text-amber-600 mt-1" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-300">هشدار موجودی کم</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                سیستم به صورت خودکار محصولات با موجودی کم را هشدار می‌دهد
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <CheckCircle size={20} className="text-amber-600 mt-1" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-300">خروجی اکسل</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                گزارش موجودی را به فرمت CSV دانلود کنید
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'مدیریت مشتریان',
      description: 'اطلاعات مشتریان و بدهی‌ها',
      icon: Users,
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
            <CheckCircle size={20} className="text-cyan-600 mt-1" />
            <div>
              <p className="font-bold text-cyan-900 dark:text-cyan-300">پروفایل مشتریان</p>
              <p className="text-sm text-cyan-700 dark:text-cyan-400">
                اطلاعات کامل، تاریخچه خرید و بدهی هر مشتری
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
            <CheckCircle size={20} className="text-cyan-600 mt-1" />
            <div>
              <p className="font-bold text-cyan-900 dark:text-cyan-300">مدیریت بدهی</p>
              <p className="text-sm text-cyan-700 dark:text-cyan-400">
                ثبت پرداخت و تسویه کامل بدهی مشتریان
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
            <CheckCircle size={20} className="text-cyan-600 mt-1" />
            <div>
              <p className="font-bold text-cyan-900 dark:text-cyan-300">چاپ صورت حساب</p>
              <p className="text-sm text-cyan-700 dark:text-cyan-400">
                صورت حساب کامل مشتری با تاریخچه پرداخت‌ها
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'ماژول مالی',
      description: 'حسابداری دوطرفه و گزارش‌های مالی',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <CheckCircle size={20} className="text-emerald-600 mt-1" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-300">حسابداری دوطرفه</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                سیستم حسابداری حرفه‌ای با معادله حسابداری متوازن
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <CheckCircle size={20} className="text-emerald-600 mt-1" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-300">گزارش‌های جامع</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                سود و زیان، ترازنامه، تراز آزمایشی و جریان نقدی
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <CheckCircle size={20} className="text-emerald-600 mt-1" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-300">مدیریت چک‌ها</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                ثبت و پیگیری چک‌های دریافتی و پرداختی
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'میانبرهای کیبورد',
      description: 'دسترسی سریع به ویژگی‌ها',
      icon: FileText,
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">جستجوی سراسری</span>
              <kbd className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-sm font-mono">
                Ctrl + K
              </kbd>
            </div>
            <p className="text-sm text-indigo-700 dark:text-indigo-400">
              جستجو در محصولات، مشتریان، تعمیرات و فاکتورها
            </p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">دسترسی سریع</span>
              <kbd className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-sm font-mono">
                Ctrl + N
              </kbd>
            </div>
            <p className="text-sm text-indigo-700 dark:text-indigo-400">
              ثبت سریع فروش، تعمیر، مشتری و محصول جدید
            </p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">بستن Modal</span>
              <kbd className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-sm font-mono">
                Esc
              </kbd>
            </div>
            <p className="text-sm text-indigo-700 dark:text-indigo-400">
              بستن سریع پنجره‌های باز
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'آماده شروع هستید؟',
      description: 'همه چیز آماده است!',
      icon: Settings,
      color: 'bg-gradient-to-br from-pink-500 to-rose-600',
      content: (
        <div className="text-center space-y-4">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            تبریک! 🎉 شما با تمام ویژگی‌های اصلی سیستم آشنا شدید
          </p>
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
            <p className="text-sm text-pink-700 dark:text-pink-400 mb-2">
              <strong>نکات مهم:</strong>
            </p>
            <ul className="text-sm text-pink-700 dark:text-pink-400 text-right space-y-1">
              <li>• رمز عبور پیش‌فرض را تغییر دهید</li>
              <li>• اطلاعات فروشگاه را در تنظیمات وارد کنید</li>
              <li>• محصولات و مشتریان را اضافه کنید</li>
              <li>• از پشتیبان‌گیری منظم استفاده کنید</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className={`${currentStepData.color} p-6 text-white relative`}>
          <button
            onClick={skipOnboarding}
            className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <currentStepData.icon size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <p className="text-white/80 mt-1">{currentStepData.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600 w-8'
                    : index < currentStep
                    ? 'bg-blue-400'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft size={18} />
                قبلی
              </Button>
            )}
            <Button variant="primary" onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'شروع کنید' : 'بعدی'}
              {currentStep < steps.length - 1 && <ArrowRight size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

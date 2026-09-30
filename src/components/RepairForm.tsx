import React, { useState, useRef } from 'react';
import { useAuth, useToast } from '../lib/auth';
import { db, type Repair, type PhysicalConditionChecklist, type AccessoriesChecklist, type TestChecklist, type ConditionStatus, type TestStatus, type RepairStatus, type RepairConfirmations, type RepairWarnings } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Camera, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface RepairFormProps {
  repair?: Repair | null;
  onSave: (repair: Repair) => void;
  onCancel: () => void;
}

const deviceTypes = [
  { value: 'mobile', label: 'موبایل' },
  { value: 'tablet', label: 'تبلت' },
  { value: 'watch', label: 'ساعت هوشمند' },
  { value: 'laptop', label: 'لپ‌تاپ' },
  { value: 'other', label: 'سایر' },
];

const brands = ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Honor', 'Nokia', 'LG', 'Sony', 'Other'];

const conditionLabels: Record<ConditionStatus, string> = {
  healthy: 'سالم',
  scratched: 'خط و خش',
  broken: 'شکسته',
  damaged: 'آسیب‌دیده',
  unknown: 'نامشخص',
};

const conditionColors: Record<ConditionStatus, string> = {
  healthy: 'bg-green-100 text-green-700 border-green-300',
  scratched: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  broken: 'bg-red-100 text-red-700 border-red-300',
  damaged: 'bg-orange-100 text-orange-700 border-orange-300',
  unknown: 'bg-gray-100 text-gray-700 border-gray-300',
};

const testLabels: Record<TestStatus, string> = {
  passed: 'سالم',
  failed: 'ایراد دارد',
  not_tested: 'تست نشد',
  not_testable: 'قابل تست نیست',
};

const testColors: Record<TestStatus, string> = {
  passed: 'bg-green-100 text-green-700 border-green-300',
  failed: 'bg-red-100 text-red-700 border-red-300',
  not_tested: 'bg-gray-100 text-gray-700 border-gray-300',
  not_testable: 'bg-orange-100 text-orange-700 border-orange-300',
};

const physicalConditionFields = [
  { key: 'screen', label: 'صفحه نمایش' },
  { key: 'backCover', label: 'قاب پشت' },
  { key: 'frame', label: 'فریم' },
  { key: 'edges', label: 'لبه‌ها' },
  { key: 'camera', label: 'دوربین' },
  { key: 'cameraLens', label: 'لنز دوربین' },
  { key: 'chargingPort', label: 'پورت شارژ' },
  { key: 'speaker', label: 'اسپیکر' },
  { key: 'microphone', label: 'میکروفون' },
  { key: 'buttons', label: 'دکمه‌ها' },
  { key: 'simTray', label: 'سینی سیم‌کارت' },
  { key: 'battery', label: 'باتری' },
];

const testFields = [
  { key: 'power', label: 'Power' },
  { key: 'touch', label: 'Touch' },
  { key: 'display', label: 'Display' },
  { key: 'backlight', label: 'Backlight' },
  { key: 'charging', label: 'Charging' },
  { key: 'camera', label: 'Camera' },
  { key: 'flash', label: 'Flash' },
  { key: 'microphone', label: 'Microphone' },
  { key: 'speaker', label: 'Speaker' },
  { key: 'earpiece', label: 'Earpiece' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'bluetooth', label: 'Bluetooth' },
  { key: 'sim', label: 'SIM' },
  { key: 'mobileNetwork', label: 'Mobile Network' },
  { key: 'fingerprint', label: 'Fingerprint' },
  { key: 'faceId', label: 'Face ID' },
  { key: 'buttons', label: 'Buttons' },
  { key: 'vibration', label: 'Vibration' },
  { key: 'proximitySensor', label: 'Proximity' },
  { key: 'gps', label: 'GPS' },
  { key: 'nfc', label: 'NFC' },
  { key: 'battery', label: 'Battery' },
];

const serviceOptions = [
  'تعویض LCD',
  'تعویض باتری',
  'تعویض سوکت شارژ',
  'تعویض گلس',
  'تعمیر برد',
  'رفع مشکل نرم‌افزاری',
  'فلش',
  'بازیابی اطلاعات',
  'تعمیر دوربین',
  'تعمیر اسپیکر',
  'تعمیر میکروفون',
  'تعویض فلت',
];

const defaultPhysicalCondition: PhysicalConditionChecklist = {
  screen: 'unknown',
  backCover: 'unknown',
  frame: 'unknown',
  edges: 'unknown',
  camera: 'unknown',
  cameraLens: 'unknown',
  chargingPort: 'unknown',
  speaker: 'unknown',
  microphone: 'unknown',
  buttons: 'unknown',
  simTray: 'unknown',
  battery: 'unknown',
  waterDamage: false,
  impactDamage: false,
  previouslyOpened: false,
  previouslyReplacedParts: false,
  glueOrCracks: false,
};

const defaultAccessories: AccessoriesChecklist = {
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
};

const defaultTests: TestChecklist = {
  power: 'not_tested',
  touch: 'not_tested',
  display: 'not_tested',
  backlight: 'not_tested',
  charging: 'not_tested',
  camera: 'not_tested',
  flash: 'not_tested',
  microphone: 'not_tested',
  speaker: 'not_tested',
  earpiece: 'not_tested',
  wifi: 'not_tested',
  bluetooth: 'not_tested',
  sim: 'not_tested',
  mobileNetwork: 'not_tested',
  fingerprint: 'not_tested',
  faceId: 'not_tested',
  buttons: 'not_tested',
  vibration: 'not_tested',
  proximitySensor: 'not_tested',
  gps: 'not_tested',
  nfc: 'not_tested',
  battery: 'not_tested',
};

const defaultConfirmations: RepairConfirmations = {
  conditionChecked: false,
  accessoriesRegistered: false,
  issueReported: false,
  costEstimated: false,
  dataLossInformed: false,
  warrantyInformed: false,
  receiptReceived: false,
  serviceAgreed: false,
};

const defaultWarnings: RepairWarnings = {
  waterDamageWarning: false,
  boardRepairWarning: false,
  previouslyOpenedWarning: false,
  dataBackupWarning: true,
  partsAvailabilityWarning: false,
};

export default function RepairForm({ repair, onSave, onCancel }: RepairFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 11;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const [form, setForm] = useState<Partial<Repair>>(repair || {
    ticketNumber: `REP-${now.getFullYear()}-${String(db.getRepairs().length + 1).padStart(6, '0')}`,
    customerName: '',
    customerMobile: '',
    customerMobile2: '',
    customerNationalId: '',
    customerAddress: '',
    customerNotes: '',
    deviceType: 'mobile',
    device: '',
    brand: '',
    model: '',
    color: '',
    storage: '',
    ram: '',
    imei: '',
    imei2: '',
    serial: '',
    physicalCondition: defaultPhysicalCondition,
    photos: [],
    accessories: defaultAccessories,
    devicePassword: '',
    passwordType: 'none',
    passwordProvided: false,
    devicePowerStatus: 'off',
    sim1: false,
    sim2: false,
    memoryCard: false,
    reportedIssue: '',
    initialAssessment: '',
    diagnosis: '',
    initialTests: defaultTests,
    testNotPerformedReason: '',
    requestedServices: [],
    otherServiceDescription: '',
    estimatedPartsCost: 0,
    estimatedLabor: 0,
    estimatedExtraCost: 0,
    estimatedTotal: 0,
    parts: [],
    labor: 0,
    partsCost: 0,
    extraCost: 0,
    totalCost: 0,
    discount: 0,
    finalTotal: 0,
    paid: 0,
    remaining: 0,
    paymentMethod: 'cash',
    confirmations: defaultConfirmations,
    warnings: defaultWarnings,
    status: 'received',
    technicianId: user?.id || '',
    technicianName: user?.fullName || '',
    entryDate: now.toISOString().split('T')[0],
    entryTime: now.toTimeString().slice(0, 5),
    notes: '',
    createdAt: now.toISOString(),
  });

  const updateField = (field: string, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const updatePhysicalCondition = (field: keyof PhysicalConditionChecklist, value: any) => {
    setForm({
      ...form,
      physicalCondition: { ...form.physicalCondition!, [field]: value },
    });
  };

  const updateAccessories = (field: keyof AccessoriesChecklist, value: any) => {
    setForm({
      ...form,
      accessories: { ...form.accessories!, [field]: value },
    });
  };

  const updateTests = (field: keyof TestChecklist, value: TestStatus) => {
    setForm({
      ...form,
      initialTests: { ...form.initialTests!, [field]: value },
    });
  };

  const updateConfirmations = (field: keyof RepairConfirmations, value: boolean) => {
    setForm({
      ...form,
      confirmations: { ...form.confirmations!, [field]: value },
    });
  };

  const updateWarnings = (field: keyof RepairWarnings, value: boolean) => {
    setForm({
      ...form,
      warnings: { ...form.warnings!, [field]: value },
    });
  };

  const handlePhotoUpload = (type: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = () => {
        const photo = {
          id: uuidv4(),
          type: type as any,
          data: reader.result as string,
          timestamp: new Date().toISOString(),
        };
        setForm({
          ...form,
          photos: [...(form.photos || []), photo],
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1: // مشتری
        if (!form.customerName?.trim()) {
          showToast('error', 'نام مشتری الزامی است');
          return false;
        }
        if (!form.customerMobile?.trim()) {
          showToast('error', 'شماره موبایل الزامی است');
          return false;
        }
        if (!/^09\d{9}$/.test(form.customerMobile)) {
          showToast('error', 'شماره موبایل نامعتبر است');
          return false;
        }
        return true;
      
      case 2: // دستگاه
        if (!form.device?.trim()) {
          showToast('error', 'نام دستگاه الزامی است');
          return false;
        }
        return true;
      
      case 5: // ایراد
        if (!form.reportedIssue?.trim()) {
          showToast('error', 'ایراد اعلامی الزامی است');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(Math.min(step + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  const handleSubmit = () => {
    if (!form.confirmations?.serviceAgreed) {
      showToast('error', 'لطفاً تأیید مشتری را دریافت کنید');
      return;
    }

    const finalTotal = (form.totalCost || 0) - (form.discount || 0);
    const remaining = finalTotal - (form.paid || 0);

    const repairData: Repair = {
      ...form as any,
      finalTotal,
      remaining: remaining > 0 ? remaining : 0,
    };

    onSave(repairData);
  };

  const renderStep = () => {
    switch (step) {
      case 1: // اطلاعات مشتری
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۱: اطلاعات مشتری</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={e => updateField('customerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: علی رضایی"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">شماره موبایل *</label>
                <input
                  type="tel"
                  value={form.customerMobile}
                  onChange={e => updateField('customerMobile', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="09123456789"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">شماره تماس دوم</label>
                <input
                  type="tel"
                  value={form.customerMobile2}
                  onChange={e => updateField('customerMobile2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">کد ملی</label>
                <input
                  type="text"
                  value={form.customerNationalId}
                  onChange={e => updateField('customerNationalId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">آدرس</label>
              <textarea
                value={form.customerAddress}
                onChange={e => updateField('customerAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">توضیحات</label>
              <textarea
                value={form.customerNotes}
                onChange={e => updateField('customerNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>
        );

      case 2: // اطلاعات دستگاه
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۲: اطلاعات دستگاه</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">نوع دستگاه *</label>
                <select
                  value={form.deviceType}
                  onChange={e => updateField('deviceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {deviceTypes.map(dt => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">برند</label>
                <select
                  value={form.brand}
                  onChange={e => updateField('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">انتخاب کنید</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">مدل *</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={e => updateField('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: iPhone 13 Pro Max"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">رنگ</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={e => updateField('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">ظرفیت حافظه</label>
                <input
                  type="text"
                  value={form.storage}
                  onChange={e => updateField('storage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 256GB"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">RAM</label>
                <input
                  type="text"
                  value={form.ram}
                  onChange={e => updateField('ram', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 6GB"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">IMEI 1</label>
                <input
                  type="text"
                  value={form.imei}
                  onChange={e => updateField('imei', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                  placeholder="15 رقم"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">IMEI 2</label>
                <input
                  type="text"
                  value={form.imei2}
                  onChange={e => updateField('imei2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Serial Number</label>
                <input
                  type="text"
                  value={form.serial}
                  onChange={e => updateField('serial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        );

      case 3: // وضعیت ظاهری
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۳: وضعیت ظاهری دستگاه</h3>
            
            <div className="space-y-3">
              {physicalConditionFields.map(field => (
                <div key={field.key} className="border border-gray-200 rounded-lg p-3">
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(conditionLabels) as ConditionStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updatePhysicalCondition(field.key as keyof PhysicalConditionChecklist, status)}
                        className={`px-3 py-1 rounded-lg border text-sm transition-all ${
                          form.physicalCondition?.[field.key as keyof PhysicalConditionChecklist] === status
                            ? conditionColors[status] + ' ring-2 ring-offset-1 ring-blue-500'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {conditionLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">هشدارهای مهم</h4>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.physicalCondition?.waterDamage}
                  onChange={e => updatePhysicalCondition('waterDamage', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>آثار آب‌خوردگی مشاهده شد</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.physicalCondition?.impactDamage}
                  onChange={e => updatePhysicalCondition('impactDamage', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>آثار ضربه‌خوردگی مشاهده شد</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.physicalCondition?.previouslyOpened}
                  onChange={e => updatePhysicalCondition('previouslyOpened', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>دستگاه قبلاً باز شده است</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.physicalCondition?.previouslyReplacedParts}
                  onChange={e => updatePhysicalCondition('previouslyReplacedParts', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>قطعات قبلاً تعویض شده‌اند</span>
              </label>
            </div>
          </div>
        );

      case 4: // لوازم همراه
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۴: لوازم همراه</h3>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.phone}
                  onChange={e => updateAccessories('phone', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>گوشی</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.case}
                  onChange={e => updateAccessories('case', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>قاب</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.charger}
                  onChange={e => updateAccessories('charger', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>شارژر</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.cable}
                  onChange={e => updateAccessories('cable', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>کابل</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.simCard}
                  onChange={e => updateAccessories('simCard', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>سیم‌کارت</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.memoryCard}
                  onChange={e => updateAccessories('memoryCard', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>کارت حافظه</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.headphones}
                  onChange={e => updateAccessories('headphones', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>هدفون</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.box}
                  onChange={e => updateAccessories('box', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>جعبه</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accessories?.other}
                  onChange={e => updateAccessories('other', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>سایر</span>
              </label>
              
              {form.accessories?.other && (
                <input
                  type="text"
                  value={form.accessories.otherDescription}
                  onChange={e => updateAccessories('otherDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="توضیح سایر اقلام"
                />
              )}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">موجودی سیم‌کارت و حافظه</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.sim1}
                    onChange={e => updateField('sim1', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>SIM 1</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.sim2}
                    onChange={e => updateField('sim2', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>SIM 2</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.memoryCard}
                    onChange={e => updateField('memoryCard', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Memory Card</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 5: // ایراد اعلامی
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۵: ایراد اعلامی مشتری</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">ایراد اعلامی مشتری *</label>
              <textarea
                value={form.reportedIssue}
                onChange={e => updateField('reportedIssue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="مشتری چه ایرادی را گزارش کرده است؟"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">وضعیت اولیه و موارد مشاهده‌شده</label>
              <textarea
                value={form.initialAssessment}
                onChange={e => updateField('initialAssessment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="توضیحات پذیرش‌کار از وضعیت اولیه دستگاه"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>توجه:</strong> ایراد اعلامی مشتری دقیقاً مطابق گفته مشتری ثبت شود. وضعیت اولیه توسط پذیرش‌کار تکمیل شود.
              </p>
            </div>
          </div>
        );

      case 6: // تست اولیه
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۶: تست اولیه</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testFields.map(field => (
                <div key={field.key} className="border border-gray-200 rounded-lg p-3">
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(testLabels) as TestStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateTests(field.key as keyof TestChecklist, status)}
                        className={`px-2 py-1 rounded text-xs transition-all ${
                          form.initialTests?.[field.key as keyof TestChecklist] === status
                            ? testColors[status] + ' ring-1 ring-blue-500'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {testLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">علت عدم انجام برخی تست‌ها (در صورت وجود)</label>
              <textarea
                value={form.testNotPerformedReason}
                onChange={e => updateField('testNotPerformedReason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="مثال: دستگاه روشن نمی‌شود"
              />
            </div>
          </div>
        );

      case 7: // خدمات درخواستی
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۷: خدمات درخواستی</h3>
            
            <div className="space-y-2">
              {serviceOptions.map(service => (
                <label key={service} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.requestedServices?.includes(service)}
                    onChange={e => {
                      const services = form.requestedServices || [];
                      if (e.target.checked) {
                        updateField('requestedServices', [...services, service]);
                      } else {
                        updateField('requestedServices', services.filter(s => s !== service));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>{service}</span>
                </label>
              ))}
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requestedServices?.includes('سایر')}
                  onChange={e => {
                    const services = form.requestedServices || [];
                    if (e.target.checked) {
                      updateField('requestedServices', [...services, 'سایر']);
                    } else {
                      updateField('requestedServices', services.filter(s => s !== 'سایر'));
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>سایر</span>
              </label>
              
              {form.requestedServices?.includes('سایر') && (
                <input
                  type="text"
                  value={form.otherServiceDescription}
                  onChange={e => updateField('otherServiceDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="توضیح خدمات دیگر"
                />
              )}
            </div>
          </div>
        );

      case 8: // برآورد هزینه
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۸: برآورد هزینه</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">هزینه تقریبی قطعات</label>
                <input
                  type="number"
                  value={form.estimatedPartsCost}
                  onChange={e => updateField('estimatedPartsCost', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">اجرت تقریبی</label>
                <input
                  type="number"
                  value={form.estimatedLabor}
                  onChange={e => updateField('estimatedLabor', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">سایر هزینه‌ها</label>
                <input
                  type="number"
                  value={form.estimatedExtraCost}
                  onChange={e => updateField('estimatedExtraCost', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">زمان تقریبی تحویل</label>
                <input
                  type="date"
                  value={form.estimatedDeliveryDate}
                  onChange={e => updateField('estimatedDeliveryDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                مبلغ برآوردی: {((form.estimatedPartsCost || 0) + (form.estimatedLabor || 0) + (form.estimatedExtraCost || 0)).toLocaleString()} تومان
              </p>
              <p className="text-xs text-blue-700 mt-1">
                💡 این مبلغ تقریبی است و ممکن است پس از عیب‌یابی دقیق تغییر کند.
              </p>
            </div>
          </div>
        );

      case 9: // شرایط و هشدارها
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۹: شرایط و هشدارها</h3>
            
            <div className="space-y-3">
              <h4 className="font-medium">هشدارهای فعال</h4>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.warnings?.dataBackupWarning}
                  onChange={e => updateWarnings('dataBackupWarning', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <div>
                  <span className="font-medium">هشدار پشتیبان‌گیری اطلاعات</span>
                  <p className="text-xs text-gray-600 mt-1">
                    مشتری توصیه می‌شود پیش از تحویل دستگاه، از اطلاعات شخصی و مهم خود نسخه پشتیبان تهیه کند.
                  </p>
                </div>
              </label>
              
              {form.physicalCondition?.waterDamage && (
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={form.warnings?.waterDamageWarning}
                    onChange={e => updateWarnings('waterDamageWarning', e.target.checked)}
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <span className="font-medium">هشدار آب‌خوردگی</span>
                    <p className="text-xs text-gray-600 mt-1">
                      با توجه به آثار رطوبت یا آب‌خوردگی، نتیجه تعمیر و دوام قطعات قابل تضمین قطعی نیست.
                    </p>
                  </div>
                </label>
              )}
              
              {form.physicalCondition?.previouslyOpened && (
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={form.warnings?.previouslyOpenedWarning}
                    onChange={e => updateWarnings('previouslyOpenedWarning', e.target.checked)}
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <span className="font-medium">هشدار بازشدگی قبلی</span>
                    <p className="text-xs text-gray-600 mt-1">
                      دستگاه دارای سابقه بازشدگی/تعمیر قبلی است. وضعیت قطعات و اتصالات قبلی در نتیجه تعمیر فعلی مؤثر است.
                    </p>
                  </div>
                </label>
              )}
              
              {form.requestedServices?.includes('تعمیر برد') && (
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={form.warnings?.boardRepairWarning}
                    onChange={e => updateWarnings('boardRepairWarning', e.target.checked)}
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <span className="font-medium">هشدار تعمیر برد</span>
                    <p className="text-xs text-gray-600 mt-1">
                      در تعمیرات برد، نتیجه نهایی پس از عیب‌یابی و انجام تست مشخص می‌شود.
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>
        );

      case 10: // تأیید مشتری
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۱۰: تأیید مشتری</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmations?.conditionChecked}
                  onChange={e => updateConfirmations('conditionChecked', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span>وضعیت ظاهری دستگاه بررسی و ثبت شد.</span>
              </label>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmations?.accessoriesRegistered}
                  onChange={e => updateConfirmations('accessoriesRegistered', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span>اقلام همراه ثبت شد.</span>
              </label>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmations?.issueReported}
                  onChange={e => updateConfirmations('issueReported', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span>ایراد اعلامی مشتری ثبت شد.</span>
              </label>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmations?.costEstimated}
                  onChange={e => updateConfirmations('costEstimated', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span>هزینه/برآورد اولیه به مشتری اعلام شد.</span>
              </label>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmations?.dataLossInformed}
                  onChange={e => updateConfirmations('dataLossInformed', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span>مشتری درباره احتمال از دست رفتن اطلاعات مطلع شد.</span>
              </label>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmations?.warrantyInformed}
                  onChange={e => updateConfirmations('warrantyInformed', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span>شرایط گارانتی به مشتری اعلام شد.</span>
              </label>
              
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.confirmations?.receiptReceived}
                  onChange={e => updateConfirmations('receiptReceived', e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <span>مشتری رسید را دریافت کرد.</span>
              </label>
              
              <div className="border-t pt-3 mt-3">
                <label className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={form.confirmations?.serviceAgreed}
                    onChange={e => updateConfirmations('serviceAgreed', e.target.checked)}
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <span className="font-medium text-blue-900">تأیید نهایی مشتری</span>
                    <p className="text-sm text-blue-800 mt-1">
                      شرح خدمت، برآورد هزینه و شرایط اعلام‌شده را مطالعه کردم و با شروع خدمت مورد توافق موافقم.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 11: // خلاصه و چاپ
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">مرحله ۱۱: خلاصه و ثبت</h3>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">شماره پذیرش</p>
                <p className="font-mono font-bold">{form.ticketNumber}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">مشتری</p>
                <p className="font-medium">{form.customerName}</p>
                <p className="text-sm">{form.customerMobile}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">دستگاه</p>
                <p className="font-medium">{form.brand} {form.model}</p>
                {form.imei && <p className="text-sm font-mono">IMEI: {form.imei}</p>}
              </div>
              
              <div>
                <p className="text-sm text-gray-600">ایراد اعلامی</p>
                <p className="text-sm">{form.reportedIssue}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">خدمات درخواستی</p>
                <p className="text-sm">{form.requestedServices?.join('، ')}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">برآورد هزینه</p>
                <p className="font-bold text-lg">
                  {((form.estimatedPartsCost || 0) + (form.estimatedLabor || 0) + (form.estimatedExtraCost || 0)).toLocaleString()} تومان
                </p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✓ با ثبت این فرم، رسید پذیرش ایجاد شده و قابل چاپ خواهد بود.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">فرم پذیرش تعمیرات</h2>
          <button onClick={onCancel} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">مرحله {step} از {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-gray-100"
          >
            <ChevronRight size={20} />
            مرحله قبل
          </button>
          
          {step < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              مرحله بعد
              <ChevronLeft size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Check size={20} />
              ثبت پذیرش
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

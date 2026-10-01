import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { db, type Repair, type RepairPart } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { X, Save } from 'lucide-react';

interface RepairFormProps {
  repair?: Repair | null;
  initialSettled?: boolean;
  onSave: (repair: Repair) => void;
  onCancel: () => void;
}

export default function RepairForm({ repair, initialSettled = false, onSave, onCancel }: RepairFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [settled, setSettled] = useState(initialSettled);
  const settings = db.getSettings();

  const now = new Date();
  const [form, setForm] = useState<Partial<Repair>>(repair || {
    ticketNumber: `REP-${now.getFullYear()}-${String(db.getRepairs().length + 1).padStart(6, '0')}`,
    customerName: '',
    customerMobile: '',
    customerMobile2: '',
    customerNationalId: '',
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
    physicalCondition: {
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
    },
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
    devicePassword: '',
    passwordProvided: false,
    reportedIssue: '',
    initialAssessment: '',
    diagnosis: '',
    requestedServices: [],
    parts: [],
    labor: 0,
    extraCost: 0,
    discount: 0,
    paid: 0,
    paymentMethod: 'cash',
    status: 'received',
    technicianId: user?.id || '',
    technicianName: user?.fullName || '',
    entryDate: now.toISOString().split('T')[0],
    entryTime: now.toTimeString().slice(0, 5),
    estimatedDeliveryDate: '',
    notes: '',
    createdAt: now.toISOString(),
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
    warnings: {
      dataBackupWarning: true,
      waterDamageWarning: false,
      boardRepairWarning: false,
      previouslyOpenedWarning: false,
      partsAvailabilityWarning: false,
    },
  });

  const updateField = (field: string, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const addPartFromStock = () => {
    const products = db.getProducts().filter(p => p.category === 'قطعات' || p.category === 'لوازم جانبی');
    const search = prompt('جستجوی قطعه از انبار (نام یا بخش از نام):');
    if (!search) return;
    
    const found = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.model?.toLowerCase().includes(search.toLowerCase())
    );
    
    if (found.length === 0) {
      if (confirm('قطعه‌ای یافت نشد. آیا می‌خواهید دستی اضافه کنید؟')) {
        addPartManual();
      }
      return;
    }
    
    const productNames = found.map((p, i) => `${i + 1}. ${p.name} (${p.brand || ''} ${p.model || ''}) - موجودی: ${p.stock}`).join('\n');
    const choice = prompt(`قطعات یافت شده:\n${productNames}\n\nشماره قطعه مورد نظر را وارد کنید:`);
    const index = parseInt(choice || '1') - 1;
    
    if (index >= 0 && index < found.length) {
      const product = found[index];
      const qtyStr = prompt('تعداد:', '1');
      const qty = parseInt(qtyStr || '1') || 1;
      
      const part: RepairPart = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: product.sellPrice,
        total: qty * product.sellPrice,
      };
      
      setForm({ ...form, parts: [...(form.parts || []), part] });
    }
  };

  const addPartManual = () => {
    const name = prompt('نام قطعه:');
    if (!name) return;
    const qtyStr = prompt('تعداد:', '1');
    const qty = parseInt(qtyStr || '1') || 1;
    const priceStr = prompt('قیمت واحد (تومان):', '0');
    const price = parseInt(priceStr || '0') || 0;
    
    // بررسی آیا قطعه در انبار وجود دارد
    let product = db.getProducts().find(p => p.name === name);
    
    // اگر قطعه در انبار نیست، خودکار اضافه شود
    if (!product) {
      product = {
        id: uuidv4(),
        name,
        brand: '',
        model: '',
        category: 'قطعات',
        sku: '',
        barcode: '',
        imeiRequired: false,
        serialRequired: false,
        color: '',
        storage: '',
        description: 'قطعه تعمیراتی',
        buyPrice: price,
        sellPrice: Math.round(price * 1.3),
        minStock: 1,
        stock: qty, // موجودی اولیه = تعداد مورد نیاز
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveProduct(product);
      showToast('success', `قطعه "${name}" به انبار اضافه شد`);
    } else {
      // اگر قطعه وجود دارد ولی موجودی کافی نیست، اضافه شود
      if (product.stock < qty) {
        product.stock += qty;
        product.updatedAt = new Date().toISOString();
        db.saveProduct(product);
        showToast('info', `موجودی قطعه "${name}" به‌روزرسانی شد`);
      }
    }
    
    const part: RepairPart = {
      id: uuidv4(),
      productId: product.id,
      productName: name,
      quantity: qty,
      price,
      total: qty * price,
    };
    
    setForm({ ...form, parts: [...(form.parts || []), part] });
  };

  const removePart = (id: string) => {
    setForm({ ...form, parts: (form.parts || []).filter(p => p.id !== id) });
  };

  const updatePartQty = (id: string, qty: number) => {
    setForm({
      ...form,
      parts: (form.parts || []).map(p => p.id === id ? { ...p, quantity: qty, total: qty * p.price } : p)
    });
  };

  const updatePartPrice = (id: string, price: number) => {
    setForm({
      ...form,
      parts: (form.parts || []).map(p => p.id === id ? { ...p, price, total: p.quantity * price } : p)
    });
  };

  const toggleService = (service: string) => {
    const services = form.requestedServices || [];
    if (services.includes(service)) {
      updateField('requestedServices', services.filter(s => s !== service));
    } else {
      updateField('requestedServices', [...services, service]);
    }
  };

  const handleSubmit = () => {
    console.log('📝 handleSubmit فراخوانی شد');
    
    if (!form.customerName?.trim()) {
      showToast('error', 'نام مشتری الزامی است');
      return;
    }
    if (!form.customerMobile?.trim()) {
      showToast('error', 'شماره موبایل الزامی است');
      return;
    }
    if (!form.device?.trim() && !form.model?.trim()) {
      showToast('error', 'نام یا مدل دستگاه الزامی است');
      return;
    }
    if (!form.reportedIssue?.trim()) {
      showToast('error', 'ایراد اعلامی الزامی است');
      return;
    }

    // محاسبه هزینه‌ها
    const partsCost = (form.parts || []).reduce((sum, p) => sum + p.total, 0);
    const labor = form.labor || 0;
    const extraCost = form.extraCost || 0;
    const discount = form.discount || 0;
    const totalCost = partsCost + labor + extraCost;
    const finalTotal = totalCost - discount;
    
    // اگر تسویه کامل است، paid برابر finalTotal شود
    const paid = settled ? finalTotal : (form.paid || 0);
    const remaining = finalTotal - paid;

    const repairData: Repair = {
      ...form as any,
      partsCost,
      labor,
      extraCost,
      totalCost,
      discount,
      finalTotal,
      paid,
      remaining: remaining > 0 ? remaining : 0,
    };

    console.log('📝 repairData آماده ارسال:', repairData);
    console.log('📝 فراخوانی onSave...');
    onSave(repairData);
    console.log('✅ onSave فراخوانی شد');
  };

  const partsCost = (form.parts || []).reduce((sum, p) => sum + p.total, 0);
  const totalCost = partsCost + (form.labor || 0) + (form.extraCost || 0);
  const finalTotal = totalCost - (form.discount || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {repair ? `ویرایش تعمیر #${repair.ticketNumber}` : 'پذیرش تعمیر جدید'}
          </h2>
          <button onClick={onCancel} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* اطلاعات مشتری */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">اطلاعات مشتری</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={e => updateField('customerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="مثال: علی رضایی"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">شماره موبایل *</label>
                  <input
                    type="tel"
                    value={form.customerMobile}
                    onChange={e => updateField('customerMobile', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">کد ملی</label>
                  <input
                    type="text"
                    value={form.customerNationalId}
                    onChange={e => updateField('customerNationalId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* اطلاعات دستگاه */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">اطلاعات دستگاه</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نوع دستگاه</label>
                  <select
                    value={form.deviceType}
                    onChange={e => updateField('deviceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="mobile">موبایل</option>
                    <option value="tablet">تبلت</option>
                    <option value="watch">ساعت هوشمند</option>
                    <option value="laptop">لپ‌تاپ</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">برند</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={e => updateField('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Samsung, Apple, ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نام دستگاه *</label>
                  <input
                    type="text"
                    value={form.device}
                    onChange={e => updateField('device', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="مثال: iPhone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">مدل *</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={e => updateField('model', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="مثال: 13 Pro Max"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رنگ</label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={e => updateField('color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">حافظه</label>
                  <input
                    type="text"
                    value={form.storage}
                    onChange={e => updateField('storage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="256GB"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IMEI 1</label>
                  <input
                    type="text"
                    value={form.imei}
                    onChange={e => updateField('imei', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IMEI 2</label>
                  <input
                    type="text"
                    value={form.imei2}
                    onChange={e => updateField('imei2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Serial</label>
                  <input
                    type="text"
                    value={form.serial}
                    onChange={e => updateField('serial', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* لوازم همراه */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">لوازم همراه</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { key: 'phone', label: 'گوشی' },
                  { key: 'case', label: 'قاب' },
                  { key: 'charger', label: 'شارژر' },
                  { key: 'cable', label: 'کابل' },
                  { key: 'simCard', label: 'سیم‌کارت' },
                  { key: 'memoryCard', label: 'کارت حافظه' },
                  { key: 'headphones', label: 'هدفون' },
                  { key: 'box', label: 'جعبه' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(form.accessories as any)?.[item.key] || false}
                      onChange={e => {
                        const accessories = { ...form.accessories, [item.key]: e.target.checked };
                        updateField('accessories', accessories);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ایراد اعلامی */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">ایراد اعلامی مشتری</h3>
              <textarea
                value={form.reportedIssue}
                onChange={e => updateField('reportedIssue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="مشتری چه ایرادی را گزارش کرده است؟"
              />
            </div>

            {/* خدمات درخواستی */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">خدمات درخواستی</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
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
                ].map(service => (
                  <label key={service} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.requestedServices?.includes(service) || false}
                      onChange={() => toggleService(service)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* قطعات و هزینه */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">قطعات و هزینه</h3>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">قطعات مصرفی</span>
                  <div className="flex gap-2">
                    <button onClick={addPartFromStock} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                      + از انبار
                    </button>
                    <button onClick={addPartManual} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                      + دستی
                    </button>
                  </div>
                </div>
                {(form.parts || []).map(part => (
                  <div key={part.id} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{part.productName}</span>
                    <input
                      type="number"
                      value={part.quantity}
                      onChange={e => updatePartQty(part.id, Number(e.target.value))}
                      className="w-16 px-2 py-1 border rounded text-sm"
                      min="1"
                    />
                    <input
                      type="number"
                      value={part.price}
                      onChange={e => updatePartPrice(part.id, Number(e.target.value))}
                      className="w-24 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-sm font-bold w-24 text-left">{formatCurrency(part.total, settings.currency)}</span>
                    <button onClick={() => removePart(part.id)} className="text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اجرت (تومان)</label>
                  <input
                    type="number"
                    value={form.labor}
                    onChange={e => updateField('labor', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">سایر هزینه‌ها</label>
                  <input
                    type="number"
                    value={form.extraCost}
                    onChange={e => updateField('extraCost', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تخفیف</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={e => updateField('discount', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>جمع قطعات:</span>
                  <span>{formatCurrency(partsCost, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>اجرت:</span>
                  <span>{formatCurrency(form.labor || 0, settings.currency)}</span>
                </div>
                {(form.discount || 0) > 0 && (
                  <div className="flex justify-between text-sm mb-1 text-red-600">
                    <span>تخفیف:</span>
                    <span>- {formatCurrency(form.discount || 0, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-blue-300 pt-1 mt-1">
                  <span>مبلغ نهایی:</span>
                  <span className="text-green-600">{formatCurrency(finalTotal, settings.currency)}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">مبلغ پرداختی</label>
                  <input
                    type="number"
                    value={form.paid}
                    onChange={e => {
                      updateField('paid', Number(e.target.value));
                      setSettled(false);
                    }}
                    disabled={settled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">روش پرداخت</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => updateField('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">نقدی</option>
                    <option value="card">کارتخوان</option>
                    <option value="transfer">کارت‌به‌کارت</option>
                    <option value="bank">بانک</option>
                    <option value="check">چک</option>
                    <option value="credit">نسیه</option>
                  </select>
                </div>
              </div>

              {/* تیک تسویه کامل */}
              <label className="flex items-center gap-2 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settled}
                  onChange={e => {
                    const isSettled = e.target.checked;
                    setSettled(isSettled);
                    if (isSettled) {
                      updateField('paid', finalTotal);
                    }
                  }}
                  className="w-5 h-5 rounded text-green-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-700">تسویه کامل</p>
                  <p className="text-xs text-green-600">با فعال کردن، مبلغ پرداختی = مبلغ نهایی</p>
                </div>
              </label>

              {(finalTotal - (form.paid || 0)) > 0 && !settled && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-sm text-red-700">
                    مانده: {formatCurrency(finalTotal - (form.paid || 0), settings.currency)}
                  </p>
                </div>
              )}
            </div>

            {/* وضعیت و زمان تحویل */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">وضعیت و زمان تحویل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">وضعیت تعمیر</label>
                  <select
                    value={form.status}
                    onChange={e => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="received">دریافت شد</option>
                    <option value="waiting_check">در انتظار بررسی</option>
                    <option value="diagnosing">در حال عیب‌یابی</option>
                    <option value="waiting_customer_approval">در انتظار تأیید مشتری</option>
                    <option value="repairing">در حال تعمیر</option>
                    <option value="waiting_part">منتظر قطعه</option>
                    <option value="completed">تکمیل شد</option>
                    <option value="ready_for_delivery">آماده تحویل</option>
                    <option value="delivered">تحویل شد</option>
                    <option value="cancelled">لغو شد</option>
                    <option value="not_repairable">غیرقابل تعمیر</option>
                  </select>
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
            </div>

            {/* یادداشت */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-blue-600">یادداشت</h3>
              <textarea
                value={form.notes}
                onChange={e => updateField('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="توضیحات اضافی..."
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            انصراف
          </button>
          
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Save size={20} />
            {repair ? 'ذخیره تغییرات' : 'ثبت پذیرش'}
          </button>
        </div>
      </div>
    </div>
  );
}

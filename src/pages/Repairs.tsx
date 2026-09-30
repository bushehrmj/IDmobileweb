import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Repair } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Edit, X, Wrench, Printer, Eye } from 'lucide-react';
import RepairForm from '../components/RepairForm';
import RepairPrint from '../components/RepairPrint';

const statusLabels: Record<string, string> = {
  received: 'دریافت شد',
  waiting_check: 'در انتظار بررسی',
  diagnosing: 'در حال عیب‌یابی',
  waiting_customer_approval: 'در انتظار تأیید مشتری',
  repairing: 'در حال تعمیر',
  waiting_part: 'منتظر قطعه',
  completed: 'تکمیل شد',
  ready_for_delivery: 'آماده تحویل',
  delivered: 'تحویل شد',
  cancelled: 'لغو شد',
  not_repairable: 'غیرقابل تعمیر',
};

const statusColors: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  waiting_check: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  diagnosing: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  waiting_customer_approval: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  repairing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  waiting_part: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  ready_for_delivery: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  delivered: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  not_repairable: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

export default function Repairs() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | null>(null);
  const [printRepairId, setPrintRepairId] = useState<string | null>(null);
  const [printType, setPrintType] = useState<'receipt' | 'invoice'>('receipt');

  useEffect(() => { loadRepairs(); }, []);
  const loadRepairs = () => setRepairs(db.getRepairs().reverse());

  const filtered = repairs.filter(r => {
    const matchSearch = r.ticketNumber.includes(search) || r.customerName.includes(search) || r.device?.includes(search) || r.imei?.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditRepair(null);
    setShowForm(true);
  };

  const openEdit = (r: Repair) => {
    setEditRepair(r);
    setShowForm(true);
  };

  // ریست settled وقتی فرم باز می‌شود
  useEffect(() => {
    if (showForm && editRepair) {
      // اگر تعمیر تسویه شده است، settled را true کن
      // این در RepairForm مدیریت می‌شود
    }
  }, [showForm, editRepair]);

  const handleSave = (repairData: Repair) => {
    // محاسبه هزینه نهایی
    const finalTotal = (repairData.totalCost || 0) - (repairData.discount || 0);
    const remaining = finalTotal - (repairData.paid || 0);
    
    const finalRepairData: Repair = {
      ...repairData,
      finalTotal,
      remaining: remaining > 0 ? remaining : 0,
      updatedAt: new Date().toISOString(),
    };

    if (editRepair) {
      // Update existing repair
      db.saveRepair(finalRepairData);
      showToast('success', 'تعمیر ویرایش شد');
    } else {
      // Create new repair
      db.saveRepair(finalRepairData);
      showToast('success', 'تعمیر ثبت شد');
    }

    // اضافه کردن مشتری به لیست مشتریان
    if (finalRepairData.customerName && finalRepairData.customerMobile) {
      const customerNames = finalRepairData.customerName.trim().split(' ');
      const firstName = customerNames[0] || '';
      const lastName = customerNames.slice(1).join(' ') || '';
      
      // بررسی آیا مشتری با این موبایل قبلاً وجود دارد
      let customer = db.getCustomers().find(c => 
        c.mobile === finalRepairData.customerMobile && finalRepairData.customerMobile !== ''
      );
      
      if (!customer) {
        // ایجاد مشتری جدید
        customer = {
          id: uuidv4(),
          firstName: firstName,
          lastName: lastName,
          mobile: finalRepairData.customerMobile || '',
          nationalId: finalRepairData.customerNationalId || '',
          address: finalRepairData.customerAddress || '',
          notes: `مشتری تعمیرات - ${finalRepairData.brand} ${finalRepairData.model}`,
          totalPurchase: 0,
          totalPaid: 0,
          debt: 0,
          invoiceCount: 0,
          createdAt: new Date().toISOString(),
        };
        db.saveCustomer(customer);
        showToast('success', `مشتری ${finalRepairData.customerName} به لیست مشتریان اضافه شد`);
      }
    }

    // اگر تسویه کامل شده و وضعیت تحویل است، فاکتور فروش ایجاد شود
    if (finalRepairData.remaining === 0 && finalRepairData.status === 'delivered' && finalRepairData.finalTotal > 0) {
      // پیدا کردن مشتری
      const customer = db.getCustomers().find(c => 
        c.mobile === finalRepairData.customerMobile && finalRepairData.customerMobile !== ''
      );

      if (customer) {
        // ایجاد آیتم‌های فاکتور
        const saleItems: any[] = [];
        
        // اضافه کردن قطعات
        if (finalRepairData.parts && finalRepairData.parts.length > 0) {
          finalRepairData.parts.forEach(part => {
            const product = part.productId ? db.getProduct(part.productId) : db.getProducts().find(p => p.name === part.productName);
            saleItems.push({
              id: uuidv4(),
              productId: product?.id || '',
              productName: part.productName,
              brand: '',
              model: '',
              barcode: '',
              imei1: '',
              imei2: '',
              quantity: part.quantity,
              buyPrice: product?.buyPrice || 0,
              sellPrice: part.price,
              discount: 0,
              total: part.total,
            });
          });
        }

        // اضافه کردن اجرت به عنوان یک آیتم
        if (finalRepairData.labor > 0) {
          saleItems.push({
            id: uuidv4(),
            productId: '',
            productName: 'اجرت تعمیر',
            brand: '',
            model: '',
            barcode: '',
            imei1: '',
            imei2: '',
            quantity: 1,
            buyPrice: 0,
            sellPrice: finalRepairData.labor,
            discount: 0,
            total: finalRepairData.labor,
          });
        }

        // ایجاد فاکتور فروش
        const sale = {
          id: uuidv4(),
          invoiceNumber: db.getNextInvoiceNumber(),
          date: new Date().toISOString(),
          time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          customerId: customer.id,
          customerName: finalRepairData.customerName,
          sellerId: user?.id || '',
          sellerName: user?.fullName || '',
          items: saleItems,
          subtotal: finalRepairData.finalTotal,
          discount: 0,
          discountType: 'amount' as const,
          tax: 0,
          total: finalRepairData.finalTotal,
          paid: finalRepairData.finalTotal,
          remaining: 0,
          paymentMethod: 'cash' as const,
          status: 'completed' as const,
          notes: `فاکتور تعمیر شماره ${finalRepairData.ticketNumber} - ${finalRepairData.brand} ${finalRepairData.model}`,
          createdAt: new Date().toISOString(),
        };

        db.saveSale(sale);
        
        // به‌روزرسانی اطلاعات مشتری
        customer.totalPurchase += finalRepairData.finalTotal;
        customer.totalPaid += finalRepairData.finalTotal;
        customer.invoiceCount += 1;
        customer.lastPurchase = new Date().toISOString();
        db.saveCustomer(customer);
        
        showToast('success', `فاکتور فروش #${sale.invoiceNumber} برای تعمیر ایجاد و تسویه شد`);
      }
    }

    setShowForm(false);
    setEditRepair(null);
    loadRepairs();
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">تعمیرات</h2>
        {hasPermission('repairs.create') && (
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus size={16} /> پذیرش جدید
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="جستجو..." className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
          <option value="all">همه</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">#{r.ticketNumber}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{r.customerName} | {r.customerMobile}</p>
                <p className="text-xs text-slate-500">{r.brand} {r.model}</p>
                <p className="text-xs text-slate-400">{toJalali(r.entryDate)} | تعمیرکار: {r.technicianName}</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{formatCurrency(r.finalTotal || r.totalCost, settings.currency)}</p>
                {(r.remaining || 0) > 0 && <p className="text-xs text-red-500">مانده: {formatCurrency(r.remaining, settings.currency)}</p>}
                <div className="flex items-center gap-1 mt-1">
                  {hasPermission('repairs.edit') && (
                    <button onClick={() => openEdit(r)} className="text-xs text-blue-500 flex items-center gap-1"><Edit size={12} /> ویرایش</button>
                  )}
                  <button onClick={() => { setPrintRepairId(r.id); setPrintType('receipt'); }}
                    className="text-xs text-purple-500 flex items-center gap-1"><Printer size={12} /> رسید</button>
                  <button onClick={() => { setPrintRepairId(r.id); setPrintType('invoice'); }}
                    className="text-xs text-green-500 flex items-center gap-1"><Printer size={12} /> فاکتور</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">تعمیری یافت نشد</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <RepairForm
          repair={editRepair}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditRepair(null); }}
        />
      )}

      {/* Print Modal */}
      {printRepairId && (
        <RepairPrint repairId={printRepairId} type={printType} onClose={() => setPrintRepairId(null)} />
      )}
    </div>
  );
}

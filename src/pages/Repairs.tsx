import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Repair } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import { 
  Plus, Search, Edit, Printer, Wrench, X, Filter,
  CheckCircle, Clock, AlertCircle, XCircle, Eye
} from 'lucide-react';
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

const statusIcons: Record<string, any> = {
  received: Clock,
  waiting_check: Clock,
  diagnosing: AlertCircle,
  waiting_customer_approval: Clock,
  repairing: Wrench,
  waiting_part: AlertCircle,
  completed: CheckCircle,
  ready_for_delivery: CheckCircle,
  delivered: CheckCircle,
  cancelled: XCircle,
  not_repairable: XCircle,
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
  const [settled, setSettled] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [lastSavedRepairId, setLastSavedRepairId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => { loadRepairs(); }, []);
  const loadRepairs = () => setRepairs(db.getRepairs().reverse());

  const filtered = repairs.filter(r => {
    const matchSearch = r.ticketNumber.includes(search) || r.customerName.includes(search) || 
                       r.device?.includes(search) || r.imei?.includes(search) ||
                       r.brand?.includes(search) || r.model?.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditRepair(null);
    setSettled(false);
    setShowForm(true);
  };

  const openEdit = (r: Repair) => {
    setEditRepair(r);
    setSettled(r.remaining === 0 && r.status === 'delivered');
    setShowForm(true);
  };

  const handleSave = (repairData: Repair) => {
    const finalTotal = (repairData.totalCost || 0) - (repairData.discount || 0);
    const remaining = finalTotal - (repairData.paid || 0);
    
    const finalRepairData: Repair = {
      ...repairData,
      finalTotal,
      remaining: remaining > 0 ? remaining : 0,
      updatedAt: new Date().toISOString(),
    };

    if (editRepair) {
      db.saveRepair(finalRepairData);
      showToast('success', 'تعمیر ویرایش شد');
    } else {
      db.saveRepair(finalRepairData);
      showToast('success', 'تعمیر ثبت شد');
      // نمایش گزینه‌های چاپ برای تعمیر جدید
      setLastSavedRepairId(finalRepairData.id);
      setShowPrintOptions(true);
    }

    // اضافه کردن مشتری به لیست مشتریان
    if (finalRepairData.customerName && finalRepairData.customerMobile) {
      const customerNames = finalRepairData.customerName.trim().split(' ');
      const firstName = customerNames[0] || '';
      const lastName = customerNames.slice(1).join(' ') || '';
      
      let customer = db.getCustomers().find(c => 
        c.mobile === finalRepairData.customerMobile && finalRepairData.customerMobile !== ''
      );
      
      if (!customer) {
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
      const customer = db.getCustomers().find(c => 
        c.mobile === finalRepairData.customerMobile && finalRepairData.customerMobile !== ''
      );

      if (customer) {
        const saleItems: any[] = [];
        
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
        
        customer.totalPurchase += finalRepairData.finalTotal;
        customer.totalPaid += finalRepairData.finalTotal;
        customer.invoiceCount += 1;
        customer.lastPurchase = new Date().toISOString();
        db.saveCustomer(customer);
        
        // کاهش موجودی قطعات از انبار
        if (finalRepairData.parts && finalRepairData.parts.length > 0) {
          finalRepairData.parts.forEach(part => {
            if (part.productId) {
              const product = db.getProduct(part.productId);
              if (product) {
                product.stock -= part.quantity;
                if (product.stock < 0) product.stock = 0;
                product.updatedAt = new Date().toISOString();
                db.saveProduct(product);
                
                // ثبت حرکت انبار
                db.saveStockMovement({
                  id: uuidv4(),
                  productId: product.id,
                  productName: product.name,
                  type: 'out',
                  quantity: part.quantity,
                  reference: finalRepairData.ticketNumber,
                  referenceType: 'repair',
                  referenceId: finalRepairData.id,
                  userId: user?.id || '',
                  userName: user?.fullName || '',
                  date: new Date().toISOString(),
                  notes: `مصرف در تعمیر - تحویل به مشتری`,
                });
              }
            }
          });
          showToast('success', `موجودی قطعات از انبار کسر شد`);
        }
        
        showToast('success', `فاکتور فروش #${sale.invoiceNumber} برای تعمیر ایجاد و تسویه شد`);
      }
    }

    setShowForm(false);
    setEditRepair(null);
    setSettled(false);
    loadRepairs();
  };

  // Stats
  const totalRepairs = repairs.length;
  const openRepairs = repairs.filter(r => !['delivered', 'cancelled', 'not_repairable'].includes(r.status)).length;
  const readyForDelivery = repairs.filter(r => r.status === 'ready_for_delivery').length;
  const totalRevenue = repairs.filter(r => r.status === 'delivered').reduce((sum, r) => sum + (r.finalTotal || r.totalCost || 0), 0);

  // Kanban columns
  const kanbanColumns = [
    { status: 'received', label: 'دریافت شد' },
    { status: 'diagnosing', label: 'در حال عیب‌یابی' },
    { status: 'repairing', label: 'در حال تعمیر' },
    { status: 'waiting_part', label: 'منتظر قطعه' },
    { status: 'ready_for_delivery', label: 'آماده تحویل' },
    { status: 'delivered', label: 'تحویل شد' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تعمیرات</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت پذیرش و تعمیرات دستگاه‌ها</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              لیست
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              کانبان
            </button>
          </div>
          {hasPermission('repairs.create') && (
            <Button variant="primary" onClick={openNew}>
              <Plus size={18} />
              پذیرش جدید
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Wrench size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل تعمیرات</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalRepairs}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">باز</p>
              <p className="text-xl font-bold text-amber-600">{openRepairs}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">آماده تحویل</p>
              <p className="text-xl font-bold text-green-600">{readyForDelivery}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Wrench size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">درآمد تعمیرات</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalRevenue, settings.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">جستجو و فیلتر</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو شماره، مشتری، دستگاه، IMEI..." 
              className="input pr-12" 
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filtered.map(r => {
            const StatusIcon = statusIcons[r.status] || Clock;
            return (
              <div key={r.id} className="card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-lg text-slate-900 dark:text-white">
                        #{r.ticketNumber}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[r.status]}`}>
                        <StatusIcon size={12} />
                        {statusLabels[r.status]}
                      </span>
                      {(r.remaining || 0) === 0 && r.status === 'delivered' && (
                        <span className="badge badge-success">تسویه ✓</span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">مشتری:</span> {r.customerName} | {r.customerMobile}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">دستگاه:</span> {r.brand} {r.model} {r.device}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">تاریخ:</span> {toJalali(r.entryDate)} | تعمیرکار: {r.technicianName}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(r.finalTotal || r.totalCost || 0, settings.currency)}
                    </p>
                    {(r.remaining || 0) > 0 && (
                      <p className="text-sm text-red-500 mt-1">
                        مانده: {formatCurrency(r.remaining, settings.currency)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {hasPermission('repairs.edit') && (
                        r.remaining > 0 || r.status !== 'delivered' || user?.role === 'admin' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEdit(r)}
                          >
                            <Edit size={14} />
                            ویرایش
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">فقط مدیر</span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filtered.length === 0 && (
            <div className="card p-12 text-center">
              <Wrench size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">تعمیری یافت نشد</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {search || statusFilter !== 'all' 
                  ? 'فیلترهای خود را تغییر دهید' 
                  : 'اولین پذیرش تعمیر را ثبت کنید'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
          {kanbanColumns.map(col => {
            const columnRepairs = filtered.filter(r => r.status === col.status);
            return (
              <div key={col.status} className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 min-w-[250px]">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{col.label}</h3>
                  <span className="badge badge-info text-xs">{columnRepairs.length}</span>
                </div>
                <div className="space-y-2">
                  {columnRepairs.map(r => (
                    <div 
                      key={r.id} 
                      className="bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openEdit(r)}
                    >
                      <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                        #{r.ticketNumber}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{r.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {r.brand} {r.model}
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {formatCurrency(r.finalTotal || r.totalCost || 0, settings.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <RepairForm
          repair={editRepair}
          initialSettled={settled}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditRepair(null); setSettled(false); }}
          onPrintReceipt={editRepair ? () => {
            setPrintRepairId(editRepair.id);
            setPrintType('receipt');
          } : undefined}
          onPrintInvoice={editRepair ? () => {
            setPrintRepairId(editRepair.id);
            setPrintType('invoice');
          } : undefined}
        />
      )}

      {/* Print Options Modal - After saving new repair */}
      {showPrintOptions && lastSavedRepairId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تعمیر با موفقیت ثبت شد</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">آیا می‌خواهید رسید یا فاکتور را چاپ کنید؟</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => {
                  setPrintRepairId(lastSavedRepairId);
                  setPrintType('receipt');
                  setShowPrintOptions(false);
                }}
              >
                <Printer size={18} />
                چاپ رسید پذیرش
              </Button>
              
              <Button 
                variant="success" 
                className="w-full"
                onClick={() => {
                  setPrintRepairId(lastSavedRepairId);
                  setPrintType('invoice');
                  setShowPrintOptions(false);
                }}
              >
                <Printer size={18} />
                چاپ فاکتور
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setShowPrintOptions(false);
                  setLastSavedRepairId(null);
                }}
              >
                بعداً چاپ می‌کنم
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printRepairId && (
        <RepairPrint repairId={printRepairId} type={printType} onClose={() => setPrintRepairId(null)} />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Repair } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import { 
  Plus, Search, Edit, Printer, Wrench, X, Filter,
  CheckCircle, Clock, AlertCircle, XCircle, Eye,
  Phone, Calendar, DollarSign, User, Smartphone,
  ChevronRight, MoreVertical, MessageSquare, TrendingUp,
  Activity, Award, Target, Zap, BarChart3, PieChart
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
  received: 'bg-blue-500',
  waiting_check: 'bg-amber-500',
  diagnosing: 'bg-purple-500',
  waiting_customer_approval: 'bg-orange-500',
  repairing: 'bg-indigo-500',
  waiting_part: 'bg-yellow-500',
  completed: 'bg-green-500',
  ready_for_delivery: 'bg-emerald-500',
  delivered: 'bg-slate-500',
  cancelled: 'bg-red-500',
  not_repairable: 'bg-gray-500',
};

const priorityLabels: Record<string, string> = {
  low: 'کم',
  normal: 'عادی',
  high: 'زیاد',
  urgent: 'فوری',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Repairs() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | null>(null);
  const [printRepairId, setPrintRepairId] = useState<string | null>(null);
  const [printType, setPrintType] = useState<'receipt' | 'invoice'>('receipt');
  const [settled, setSettled] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  useEffect(() => { loadRepairs(); }, []);
  const loadRepairs = () => setRepairs(db.getRepairs().reverse());

  // فیلتر پیشرفته
  const filtered = repairs.filter(r => {
    const matchSearch = r.ticketNumber.includes(search) || 
                       r.customerName.toLowerCase().includes(search.toLowerCase()) || 
                       r.device?.toLowerCase().includes(search.toLowerCase()) || 
                       r.imei?.includes(search) ||
                       r.brand?.toLowerCase().includes(search.toLowerCase()) || 
                       r.model?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchTechnician = technicianFilter === 'all' || r.technicianName === technicianFilter;
    
    let matchDate = true;
    if (dateFilter !== 'all') {
      const repairDate = new Date(r.entryDate);
      const now = new Date();
      if (dateFilter === 'today') {
        matchDate = repairDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchDate = repairDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchDate = repairDate >= monthAgo;
      }
    }
    
    return matchSearch && matchStatus && matchPriority && matchTechnician && matchDate;
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

    // اضافه کردن مشتری
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
          firstName,
          lastName,
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
      }
    }

    // ایجاد یا به‌روزرسانی فاکتور فروش هنگام تحویل و تسویه
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

        // بررسی آیا قبلاً فاکتوری برای این تعمیر ساخته شده
        if (finalRepairData.saleId) {
          // به‌روزرسانی فاکتور موجود
          const existingSale = db.getSale(finalRepairData.saleId);
          if (existingSale) {
            existingSale.items = saleItems;
            existingSale.subtotal = finalRepairData.finalTotal;
            existingSale.total = finalRepairData.finalTotal;
            existingSale.paid = finalRepairData.finalTotal;
            existingSale.remaining = 0;
            existingSale.notes = `فاکتور تعمیر شماره ${finalRepairData.ticketNumber} - ${finalRepairData.brand} ${finalRepairData.model}`;
            db.saveSale(existingSale);
            showToast('success', `فاکتور فروش #${existingSale.invoiceNumber} به‌روزرسانی شد`);
          }
        } else {
          // ایجاد فاکتور جدید
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
          
          // ذخیره saleId در repair
          finalRepairData.saleId = sale.id;
          
          customer.totalPurchase += finalRepairData.finalTotal;
          customer.totalPaid += finalRepairData.finalTotal;
          customer.invoiceCount += 1;
          customer.lastPurchase = new Date().toISOString();
          db.saveCustomer(customer);
          
          showToast('success', `فاکتور فروش #${sale.invoiceNumber} ایجاد شد`);
        }
      }
    }

    // ذخیره نهایی تعمیر (فقط یک بار)
    if (editRepair) {
      db.saveRepair(finalRepairData);
      showToast('success', 'تعمیر ویرایش شد');
    } else {
      db.saveRepair(finalRepairData);
      showToast('success', 'تعمیر ثبت شد');
    }

    setShowForm(false);
    setEditRepair(null);
    setSettled(false);
    loadRepairs();
  };

  // آمار پیشرفته
  const stats = {
    total: repairs.length,
    open: repairs.filter(r => !['delivered', 'cancelled', 'not_repairable'].includes(r.status)).length,
    ready: repairs.filter(r => r.status === 'ready_for_delivery').length,
    delivered: repairs.filter(r => r.status === 'delivered').length,
    revenue: repairs.filter(r => r.status === 'delivered').reduce((sum, r) => sum + (r.finalTotal || r.totalCost || 0), 0),
    urgent: repairs.filter(r => r.priority === 'urgent' && !['delivered', 'cancelled'].includes(r.status)).length,
    overdue: repairs.filter(r => {
      if (['delivered', 'cancelled'].includes(r.status)) return false;
      const daysSinceEntry = (Date.now() - new Date(r.entryDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceEntry > 7;
    }).length,
  };

  // آمار تعمیرکاران
  const technicianStats = repairs.reduce((acc, r) => {
    if (!r.technicianName) return acc;
    if (!acc[r.technicianName]) {
      acc[r.technicianName] = { count: 0, revenue: 0 };
    }
    acc[r.technicianName].count++;
    if (r.status === 'delivered') {
      acc[r.technicianName].revenue += r.finalTotal || r.totalCost || 0;
    }
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const technicians = Object.keys(technicianStats);

  // Kanban columns
  const kanbanColumns = [
    { status: 'received', label: 'دریافت شد', color: 'bg-blue-500', icon: Clock },
    { status: 'diagnosing', label: 'عیب‌یابی', color: 'bg-purple-500', icon: Search },
    { status: 'repairing', label: 'در حال تعمیر', color: 'bg-indigo-500', icon: Wrench },
    { status: 'waiting_part', label: 'منتظر قطعه', color: 'bg-yellow-500', icon: AlertCircle },
    { status: 'ready_for_delivery', label: 'آماده تحویل', color: 'bg-emerald-500', icon: CheckCircle },
    { status: 'delivered', label: 'تحویل شد', color: 'bg-slate-500', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">مدیریت تعمیرات</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">سیستم حرفه‌ای پذیرش و پیگیری تعمیرات</p>
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
            <button 
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              تایم‌لاین
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

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">کل</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">باز</p>
              <p className="text-xl font-bold text-amber-600">{stats.open}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">آماده</p>
              <p className="text-xl font-bold text-emerald-600">{stats.ready}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">تحویل</p>
              <p className="text-xl font-bold text-green-600">{stats.delivered}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">فوری</p>
              <p className="text-xl font-bold text-red-600">{stats.urgent}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400"> overdue</p>
              <p className="text-xl font-bold text-orange-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">درآمد</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.revenue, settings.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">فیلترهای پیشرفته</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
          >
            <BarChart3 size={16} />
            آمار تعمیرکاران
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
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
          <select 
            value={priorityFilter} 
            onChange={e => setPriorityFilter(e.target.value)}
            className="input"
          >
            <option value="all">همه اولویت‌ها</option>
            {Object.entries(priorityLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value as any)}
            className="input"
          >
            <option value="all">همه تاریخ‌ها</option>
            <option value="today">امروز</option>
            <option value="week">هفته اخیر</option>
            <option value="month">ماه اخیر</option>
          </select>
        </div>
      </div>

      {/* Technician Stats */}
      {showAdvancedStats && technicians.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-blue-500" />
            آمار تعمیرکاران
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(technicianStats).map(([name, data]) => (
              <div key={name} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{data.count} تعمیر</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">درآمد:</span>
                  <span className="font-bold text-green-600">{formatCurrency(data.revenue, settings.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="card p-5 hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedRepair(r)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-1 h-12 rounded-full ${statusColors[r.status]}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                          #{r.ticketNumber}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColors[r.status]}`}>
                          {statusLabels[r.status]}
                        </span>
                        {(r as any).priority && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[(r as any).priority]}`}>
                            {priorityLabels[(r as any).priority]}
                          </span>
                        )}
                        {(r.remaining || 0) === 0 && r.status === 'delivered' && (
                          <span className="badge badge-success">تسویه ✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {r.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {r.customerMobile}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">دستگاه</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        <Smartphone size={14} className="inline mr-1" />
                        {r.brand} {r.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تاریخ پذیرش</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        <Calendar size={14} className="inline mr-1" />
                        {toJalali(r.entryDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مبلغ کل</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(r.finalTotal || r.totalCost || 0, settings.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مانده</p>
                      <p className={`text-sm font-bold ${(r.remaining || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(r.remaining || 0, settings.currency)}
                      </p>
                    </div>
                  </div>

                  {r.reportedIssue && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ایراد اعلامی:</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{r.reportedIssue}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {hasPermission('repairs.edit') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                    >
                      <Edit size={14} />
                      ویرایش
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setPrintRepairId(r.id); setPrintType('receipt'); }}
                  >
                    <Printer size={14} />
                    رسید
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setPrintRepairId(r.id); setPrintType('invoice'); }}
                  >
                    <Printer size={14} />
                    فاکتور
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const columnRepairs = filtered.filter(r => r.status === col.status);
            const Icon = col.icon;
            return (
              <div key={col.status} className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 min-w-[280px]">
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${col.color} rounded-lg flex items-center justify-center`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{col.label}</h3>
                  </div>
                  <span className="badge badge-info text-xs">{columnRepairs.length}</span>
                </div>
                <div className="space-y-2">
                  {columnRepairs.map(r => (
                    <div 
                      key={r.id} 
                      className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedRepair(r)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          #{r.ticketNumber}
                        </p>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatCurrency(r.finalTotal || r.totalCost || 0, settings.currency)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{r.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {r.brand} {r.model}
                      </p>
                      {(r.remaining || 0) > 0 && (
                        <p className="text-xs text-red-600 mt-2">
                          مانده: {formatCurrency(r.remaining, settings.currency)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">تایم‌لاین تعمیرات</h3>
          <div className="space-y-4">
            {filtered.map(r => (
              <div key={r.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${statusColors[r.status]}`}></div>
                  <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">#{r.ticketNumber}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{r.customerName} - {r.brand} {r.model}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColors[r.status]}`}>
                        {statusLabels[r.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{toJalali(r.entryDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repair Detail Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${statusColors[selectedRepair.status]} rounded-xl flex items-center justify-center`}>
                  <Wrench size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    تعمیر #{selectedRepair.ticketNumber}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {statusLabels[selectedRepair.status]}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRepair(null)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <User size={18} className="text-blue-500" />
                  اطلاعات مشتری
                </h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">نام</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedRepair.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">موبایل</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedRepair.customerMobile}</p>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Smartphone size={18} className="text-purple-500" />
                  اطلاعات دستگاه
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">برند</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedRepair.brand || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مدل</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedRepair.model || '-'}</p>
                  </div>
                  {selectedRepair.imei && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IMEI</p>
                      <p className="font-mono text-sm text-slate-900 dark:text-white">{selectedRepair.imei}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Issue */}
              {selectedRepair.reportedIssue && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <MessageSquare size={18} className="text-amber-500" />
                    ایراد اعلامی
                  </h4>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-slate-900 dark:text-white">{selectedRepair.reportedIssue}</p>
                  </div>
                </div>
              )}

              {/* Financial */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-500" />
                  اطلاعات مالی
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مبلغ کل</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(selectedRepair.finalTotal || selectedRepair.totalCost || 0, settings.currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">پرداخت شده</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedRepair.paid || 0, settings.currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مانده</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(selectedRepair.remaining || 0, settings.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                {hasPermission('repairs.edit') && (
                  <Button variant="primary" className="flex-1" onClick={() => { setSelectedRepair(null); openEdit(selectedRepair); }}>
                    <Edit size={18} />
                    ویرایش
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => { setPrintRepairId(selectedRepair.id); setPrintType('receipt'); }}>
                  <Printer size={18} />
                  چاپ رسید
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setPrintRepairId(selectedRepair.id); setPrintType('invoice'); }}>
                  <Printer size={18} />
                  چاپ فاکتور
                </Button>
              </div>
            </div>
          </div>
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

      {/* Print Modal */}
      {printRepairId && (
        <RepairPrint repairId={printRepairId} type={printType} onClose={() => setPrintRepairId(null)} />
      )}
    </div>
  );
}

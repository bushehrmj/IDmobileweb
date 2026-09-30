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

  const handleSave = (repairData: Repair) => {
    if (editRepair) {
      // Update existing repair
      const updatedRepair = { ...repairData, updatedAt: new Date().toISOString() };
      db.saveRepair(updatedRepair);
      showToast('success', 'تعمیر ویرایش شد');
    } else {
      // Create new repair
      db.saveRepair(repairData);
      showToast('success', 'تعمیر ثبت شد');
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

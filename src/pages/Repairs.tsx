import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Repair, type RepairPart } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Edit, X, Wrench, Printer, FileText } from 'lucide-react';

const statusLabels: Record<string, string> = {
  received: 'دریافت شد', waiting_check: 'در انتظار بررسی', repairing: 'در حال تعمیر',
  waiting_part: 'منتظر قطعه', ready: 'آماده تحویل', delivered: 'تحویل داده شد', cancelled: 'لغو شد',
};
const statusColors: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  waiting_check: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  repairing: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  waiting_part: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  ready: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  delivered: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
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

  const [form, setForm] = useState<Partial<Repair>>({
    customerName: '', customerMobile: '', device: '', brand: '', model: '',
    imei: '', serial: '', color: '', physicalCondition: '', accessories: '',
    devicePassword: '', reportedIssue: '', diagnosis: '', parts: [],
    labor: 0, partsCost: 0, extraCost: 0, totalCost: 0, paid: 0, remaining: 0,
    status: 'received', entryDate: new Date().toISOString().split('T')[0], notes: '',
  });

  useEffect(() => { loadRepairs(); }, []);
  const loadRepairs = () => setRepairs(db.getRepairs().reverse());

  const filtered = repairs.filter(r => {
    const matchSearch = r.ticketNumber.includes(search) || r.customerName.includes(search) || r.device?.includes(search) || r.imei?.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditRepair(null);
    setForm({
      customerName: '', customerMobile: '', device: '', brand: '', model: '',
      imei: '', serial: '', color: '', physicalCondition: '', accessories: '',
      devicePassword: '', reportedIssue: '', diagnosis: '', parts: [],
      labor: 0, partsCost: 0, extraCost: 0, totalCost: 0, paid: 0, remaining: 0,
      status: 'received', entryDate: new Date().toISOString().split('T')[0], notes: '',
    });
    setShowForm(true);
  };

  const openEdit = (r: Repair) => { setEditRepair(r); setForm({ ...r }); setShowForm(true); };

  const calcTotal = (f: Partial<Repair>) => {
    const partsCost = (f.parts || []).reduce((s, p) => s + p.total, 0);
    const totalCost = partsCost + (f.labor || 0) + (f.extraCost || 0);
    return { partsCost, totalCost };
  };

  const addPart = () => {
    const choice = confirm('آیا می‌خواهید قطعه را از انبار انتخاب کنید؟\n\nOK = انتخاب از انبار\nCancel = افزودن دستی');
    
    if (choice) {
      // انتخاب از انبار
      const products = db.getProducts().filter(p => p.category === 'قطعات' && p.stock > 0);
      if (products.length === 0) {
        showToast('error', 'قطعه‌ای در انبار وجود ندارد');
        return;
      }
      const name = prompt('نام قطعه را وارد کنید:');
      if (!name) return;
      const product = products.find(p => p.name.includes(name));
      if (!product) {
        showToast('error', 'قطعه یافت نشد');
        return;
      }
      const qtyStr = prompt('تعداد:', '1');
      if (!qtyStr) return;
      const quantity = parseInt(qtyStr) || 1;
      
      const part: RepairPart = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        price: product.buyPrice,
        total: product.buyPrice * quantity,
      };
      setForm({ ...form, parts: [...(form.parts || []), part] });
      showToast('success', `${product.name} (${quantity} عدد) اضافه شد`);
    } else {
      // افزودن دستی
      const name = prompt('نام قطعه:');
      if (!name) return;
      const qtyStr = prompt('تعداد:', '1');
      if (!qtyStr) return;
      const quantity = parseInt(qtyStr) || 1;
      const priceStr = prompt('قیمت واحد:', '0');
      if (!priceStr) return;
      const price = parseInt(priceStr) || 0;
      
      const part: RepairPart = {
        id: uuidv4(),
        productId: '',
        productName: name,
        quantity: quantity,
        price: price,
        total: price * quantity,
      };
      setForm({ ...form, parts: [...(form.parts || []), part] });
      showToast('success', `${name} (${quantity} عدد) اضافه شد`);
    }
  };

  const removePart = (id: string) => {
    setForm({ ...form, parts: (form.parts || []).filter(p => p.id !== id) });
  };

  const printReceipt = (repair: Repair) => {
    const settings = db.getSettings();
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>رسید پذیرش تعمیر #${repair.ticketNumber}</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; padding: 10px; direction: rtl; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 16px; }
          .info { margin: 10px 0; }
          .info p { margin: 5px 0; }
          .section { margin: 15px 0; padding: 10px; border: 1px solid #ddd; }
          .section h3 { margin: 0 0 10px 0; font-size: 13px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; }
          .signature { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature div { width: 45%; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.storeName}</h1>
          <p>رسید پذیرش تعمیر</p>
          <p>شماره: ${repair.ticketNumber}</p>
          <p>تاریخ: ${toJalali(repair.entryDate)}</p>
        </div>
        
        <div class="section">
          <h3>مشخصات مشتری</h3>
          <p><strong>نام:</strong> ${repair.customerName}</p>
          <p><strong>موبایل:</strong> ${repair.customerMobile || '-'}</p>
        </div>
        
        <div class="section">
          <h3>مشخصات دستگاه</h3>
          <p><strong>دستگاه:</strong> ${repair.device}</p>
          <p><strong>برند:</strong> ${repair.brand || '-'}</p>
          <p><strong>مدل:</strong> ${repair.model || '-'}</p>
          <p><strong>IMEI:</strong> ${repair.imei || '-'}</p>
          <p><strong>رنگ:</strong> ${repair.color || '-'}</p>
          <p><strong>وضعیت ظاهری:</strong> ${repair.physicalCondition || '-'}</p>
          <p><strong>لوازم همراه:</strong> ${repair.accessories || '-'}</p>
        </div>
        
        <div class="section">
          <h3>ایراد اعلامی</h3>
          <p>${repair.reportedIssue || '-'}</p>
        </div>
        
        <div class="footer">
          <p>این رسید به منزله پذیرش دستگاه می‌باشد</p>
          <div class="signature">
            <div>امضاء مشتری</div>
            <div>امضاء پذیرش</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const printInvoice = (repair: Repair) => {
    const settings = db.getSettings();
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>فاکتور تعمیر #${repair.ticketNumber}</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; padding: 10px; direction: rtl; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 16px; }
          .info { margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.storeName}</h1>
          <p>فاکتور تعمیر</p>
          <p>شماره: ${repair.ticketNumber}</p>
          <p>تاریخ: ${toJalali(repair.entryDate)}</p>
        </div>
        
        <div class="info">
          <p><strong>مشتری:</strong> ${repair.customerName}</p>
          <p><strong>دستگاه:</strong> ${repair.device} ${repair.brand} ${repair.model}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>شرح</th>
              <th>تعداد</th>
              <th>قیمت</th>
              <th>جمع</th>
            </tr>
          </thead>
          <tbody>
            ${repair.parts.map(p => `
              <tr>
                <td>${p.productName}</td>
                <td>${p.quantity}</td>
                <td>${formatCurrency(p.price, settings.currency)}</td>
                <td>${formatCurrency(p.total, settings.currency)}</td>
              </tr>
            `).join('')}
            <tr>
              <td><strong>اجرت تعمیر</strong></td>
              <td>1</td>
              <td>${formatCurrency(repair.labor, settings.currency)}</td>
              <td>${formatCurrency(repair.labor, settings.currency)}</td>
            </tr>
            ${repair.extraCost > 0 ? `
              <tr>
                <td><strong>هزینه‌های اضافی</strong></td>
                <td>1</td>
                <td>${formatCurrency(repair.extraCost, settings.currency)}</td>
                <td>${formatCurrency(repair.extraCost, settings.currency)}</td>
              </tr>
            ` : ''}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3"><strong>جمع کل</strong></td>
              <td><strong>${formatCurrency(repair.totalCost, settings.currency)}</strong></td>
            </tr>
            <tr>
              <td colspan="3">پرداخت شده</td>
              <td>${formatCurrency(repair.paid, settings.currency)}</td>
            </tr>
            ${repair.remaining > 0 ? `
              <tr>
                <td colspan="3"><strong>مانده</strong></td>
                <td><strong>${formatCurrency(repair.remaining, settings.currency)}</strong></td>
              </tr>
            ` : ''}
          </tfoot>
        </table>
        
        <div class="footer">
          <p>از اعتماد شما متشکریم</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const save = () => {
    if (!form.customerName?.trim()) { showToast('error', 'نام مشتری الزامی است'); return; }
    if (!form.device?.trim()) { showToast('error', 'نام دستگاه الزامی است'); return; }

    const { partsCost, totalCost } = calcTotal(form);
    const paid = Number(form.paid) || 0;

    const repair: Repair = {
      id: editRepair?.id || uuidv4(),
      ticketNumber: editRepair?.ticketNumber || db.getNextRepairNumber(),
      customerName: form.customerName || '',
      customerMobile: form.customerMobile || '',
      device: form.device || '',
      brand: form.brand || '',
      model: form.model || '',
      imei: form.imei || '',
      serial: form.serial || '',
      color: form.color || '',
      physicalCondition: form.physicalCondition || '',
      accessories: form.accessories || '',
      devicePassword: form.devicePassword || '',
      reportedIssue: form.reportedIssue || '',
      diagnosis: form.diagnosis || '',
      parts: form.parts || [],
      labor: Number(form.labor) || 0,
      partsCost,
      extraCost: Number(form.extraCost) || 0,
      totalCost,
      paid,
      remaining: totalCost - paid,
      technicianId: editRepair?.technicianId || user?.id || '',
      technicianName: editRepair?.technicianName || user?.fullName || '',
      status: (form.status as Repair['status']) || 'received',
      entryDate: form.entryDate || new Date().toISOString().split('T')[0],
      deliveryDate: form.status === 'delivered' ? new Date().toISOString() : editRepair?.deliveryDate,
      notes: form.notes || '',
      createdAt: editRepair?.createdAt || new Date().toISOString(),
    };

    // If status changed to delivered, consume parts from stock
    if (editRepair && editRepair.status !== 'delivered' && repair.status === 'delivered') {
      repair.parts.forEach(part => {
        if (part.productId) {
          const product = db.getProduct(part.productId);
          if (product) {
            product.stock -= part.quantity;
            db.saveProduct(product);
            db.saveStockMovement({
              id: uuidv4(), productId: product.id, productName: product.name,
              type: 'out', quantity: part.quantity, reference: repair.ticketNumber,
              referenceType: 'repair', referenceId: repair.id,
              userId: user?.id || '', userName: user?.fullName || '',
              date: new Date().toISOString(), notes: 'مصرف در تعمیر',
            });
          }
        }
      });
    }

    db.saveRepair(repair);
    db.addAuditLog({
      id: uuidv4(), userId: user?.id || '', userName: user?.fullName || '',
      action: editRepair ? 'edit_repair' : 'create_repair', entity: 'repair', entityId: repair.id,
      newValue: `تعمیر #${repair.ticketNumber} - ${repair.customerName} - ${repair.status}`,
      ip: '127.0.0.1', date: new Date().toISOString(),
    });

    showToast('success', editRepair ? 'تعمیر ویرایش شد' : 'تعمیر ثبت شد');
    setShowForm(false);
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
          placeholder="جستجو شماره، مشتری، دستگاه..." className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
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
                <p className="text-xs text-slate-500">{r.device} {r.brand} {r.model}</p>
                <p className="text-xs text-slate-400">{toJalali(r.entryDate)} | تعمیرکار: {r.technicianName}</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{formatCurrency(r.totalCost, settings.currency)}</p>
                {r.remaining > 0 && <p className="text-xs text-red-500">مانده: {formatCurrency(r.remaining, settings.currency)}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => printReceipt(r)} className="text-xs text-purple-500 flex items-center gap-1" title="چاپ رسید">
                    <FileText size={12} /> رسید
                  </button>
                  {r.status === 'delivered' && (
                    <button onClick={() => printInvoice(r)} className="text-xs text-green-500 flex items-center gap-1" title="چاپ فاکتور">
                      <Printer size={12} /> فاکتور
                    </button>
                  )}
                  {hasPermission('repairs.edit') && (
                    <button onClick={() => openEdit(r)} className="text-xs text-blue-500 flex items-center gap-1"><Edit size={12} /> ویرایش</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">تعمیری یافت نشد</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h3 className="font-bold">{editRepair ? `ویرایش #${editRepair.ticketNumber}` : 'پذیرش تعمیر'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">نام مشتری *</label>
                  <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">موبایل مشتری</label>
                  <input type="tel" value={form.customerMobile} onChange={e => setForm({ ...form, customerMobile: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">دستگاه *</label>
                  <input type="text" value={form.device} onChange={e => setForm({ ...form, device: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">برند</label>
                  <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">مدل</label>
                  <input type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">IMEI</label>
                  <input type="text" value={form.imei} onChange={e => setForm({ ...form, imei: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">رنگ</label>
                  <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">رمز دستگاه</label>
                  <input type="text" value={form.devicePassword} onChange={e => setForm({ ...form, devicePassword: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">وضعیت ظاهری</label>
                <input type="text" value={form.physicalCondition} onChange={e => setForm({ ...form, physicalCondition: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" placeholder="خط و خش، شکستگی و..." />
              </div>
              <div>
                <label className="text-xs text-slate-500">لوازم همراه</label>
                <input type="text" value={form.accessories} onChange={e => setForm({ ...form, accessories: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" placeholder="شارژر، کابل، گلس و..." />
              </div>
              <div>
                <label className="text-xs text-slate-500">ایراد اعلامی</label>
                <textarea value={form.reportedIssue} onChange={e => setForm({ ...form, reportedIssue: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
              </div>
              <div>
                <label className="text-xs text-slate-500">عیب‌یابی</label>
                <textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
              </div>

              {/* Parts */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-500">قطعات مصرفی</label>
                  <button onClick={addPart} className="text-xs text-blue-600">+ افزودن قطعه</button>
                </div>
                {(form.parts || []).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded mb-1 text-xs">
                    <span>{p.productName} × {p.quantity}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(p.total, settings.currency)}</span>
                      <button onClick={() => removePart(p.id)} className="text-red-500"><X size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500">اجرت</label>
                  <input type="number" value={form.labor} onChange={e => setForm({ ...form, labor: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">هزینه اضافی</label>
                  <input type="number" value={form.extraCost} onChange={e => setForm({ ...form, extraCost: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">پرداخت</label>
                  <input type="number" value={form.paid} onChange={e => setForm({ ...form, paid: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
              </div>

              {(() => { const { totalCost } = calcTotal(form); const rem = totalCost - (Number(form.paid) || 0); return (
                <div className="flex justify-between text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                  <span>جمع کل: {formatCurrency(totalCost, settings.currency)}</span>
                  {rem > 0 && <span className="text-red-500">مانده: {formatCurrency(rem, settings.currency)}</span>}
                </div>
              ); })()}

              <div>
                <label className="text-xs text-slate-500">وضعیت</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Repair['status'] })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">توضیحات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
              </div>

              <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                {editRepair ? 'ذخیره تغییرات' : 'ثبت پذیرش'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

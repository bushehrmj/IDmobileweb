import React, { useState, useEffect } from 'react';
import { useAuth, useToast, formatCurrency, toJalali } from '../lib/auth';
import { db, type Repair, type RepairPart } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Edit, X, Wrench, Printer } from 'lucide-react';
import RepairPrint from '../components/RepairPrint';

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
  const [printRepairId, setPrintRepairId] = useState<string | null>(null);
  const [printType, setPrintType] = useState<'receipt' | 'invoice'>('receipt');

  const [form, setForm] = useState<Partial<Repair>>({
    customerName: '', customerMobile: '', device: '', brand: '', model: '',
    imei: '', serial: '', color: '', physicalCondition: '', accessories: '',
    devicePassword: '', reportedIssue: '', diagnosis: '', parts: [],
    labor: 0, partsCost: 0, extraCost: 0, totalCost: 0, paid: 0, remaining: 0,
    status: 'received', entryDate: new Date().toISOString().split('T')[0], notes: '',
  });
  const [settled, setSettled] = useState(false);

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
    setSettled(false);
    setShowForm(true);
  };

  const openEdit = (r: Repair) => { 
    setEditRepair(r); 
    setForm({ ...r }); 
    setSettled(r.remaining === 0 && r.status === 'delivered');
    setShowForm(true); 
  };

  const calcTotal = (f: Partial<Repair>) => {
    const partsCost = (f.parts || []).reduce((s, p) => s + p.total, 0);
    const totalCost = partsCost + (f.labor || 0) + (f.extraCost || 0);
    return { partsCost, totalCost };
  };

  // افزودن قطعه از انبار
  const addPartFromStock = () => {
    const name = prompt('نام قطعه (برای جستجو در انبار):');
    if (!name) return;
    const products = db.getProducts();
    const product = products.find(p => p.name.includes(name) || p.category === 'قطعات');
    if (product) {
      const part: RepairPart = {
        id: uuidv4(), productId: product.id, productName: product.name,
        quantity: 1, price: product.buyPrice, total: product.buyPrice,
      };
      setForm({ ...form, parts: [...(form.parts || []), part] });
    } else {
      addPartManual();
    }
  };

  // افزودن قطعه دستی
  const addPartManual = () => {
    const name = prompt('نام قطعه:');
    if (!name) return;
    const qtyStr = prompt('تعداد:', '1');
    const qty = parseInt(qtyStr || '1') || 1;
    const priceStr = prompt('قیمت واحد (تومان):', '0');
    const price = parseInt(priceStr || '0') || 0;
    const part: RepairPart = {
      id: uuidv4(), productId: '', productName: name,
      quantity: qty, price, total: qty * price,
    };
    setForm({ ...form, parts: [...(form.parts || []), part] });

    // اگر قطعه در انبار موجود است، به انبار اضافه شود (برای قطعات جدید)
    const existingProduct = db.getProducts().find(p => p.name === name);
    if (!existingProduct) {
      // ایجاد محصول جدید در انبار
      const newProduct = {
        id: uuidv4(), name, brand: '', model: '', category: 'قطعات',
        sku: '', barcode: '', imeiRequired: false, serialRequired: false,
        color: '', storage: '', description: 'قطعه تعمیراتی',
        buyPrice: price, sellPrice: Math.round(price * 1.3),
        minStock: 1, stock: qty, status: 'active' as const,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      db.saveProduct(newProduct);
      showToast('info', `قطعه "${name}" به انبار اضافه شد`);
    }
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

  const save = () => {
    if (!form.customerName?.trim()) { showToast('error', 'نام مشتری الزامی است'); return; }
    if (!form.device?.trim()) { showToast('error', 'نام دستگاه الزامی است'); return; }

    // بررسی محدودیت ویرایش بعد از تسویه
    if (editRepair && editRepair.remaining === 0 && editRepair.status === 'delivered' && user?.role !== 'admin') {
      showToast('error', 'این تعمیر تسویه شده و فقط مدیر می‌تواند ویرایش کند');
      return;
    }

    const { partsCost, totalCost } = calcTotal(form);
    
    // اگر تسویه کامل انتخاب شده، paid برابر totalCost شود
    const paid = settled ? totalCost : (Number(form.paid) || 0);

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

    // اگر وضعیت به delivered تغییر کرد، قطعات از انبار کم شود و فاکتور فروش ایجاد شود
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
        } else {
          // قطعه دستی - از انبار کم شود
          const product = db.getProducts().find(p => p.name === part.productName);
          if (product && product.stock >= part.quantity) {
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

      // ایجاد فاکتور فروش برای اجرت و قطعات - فقط وقتی تسویه شده
      if (repair.totalCost > 0 && repair.remaining === 0) {
        // پیدا کردن یا ایجاد مشتری واقعی با نام و موبایل واقعی
        const customerNames = repair.customerName.trim().split(' ');
        const firstName = customerNames[0] || '';
        const lastName = customerNames.slice(1).join(' ') || '';
        
        // بررسی آیا مشتری با این نام و موبایل قبلاً وجود دارد
        let customer = db.getCustomers().find(c => 
          c.mobile === repair.customerMobile && repair.customerMobile !== ''
        );
        
        if (!customer) {
          // ایجاد مشتری جدید
          customer = {
            id: uuidv4(),
            firstName: firstName,
            lastName: lastName,
            mobile: repair.customerMobile || '',
            nationalId: '',
            address: '',
            notes: `مشتری تعمیرات - ${repair.device} ${repair.brand} ${repair.model}`,
            totalPurchase: 0,
            totalPaid: 0,
            debt: 0,
            invoiceCount: 0,
            createdAt: new Date().toISOString(),
          };
          db.saveCustomer(customer);
          showToast('success', `مشتری ${repair.customerName} به لیست مشتریان اضافه شد`);
        }

        // ایجاد آیتم‌های فاکتور
        const saleItems: any[] = [];
        
        // اضافه کردن قطعات
        repair.parts.forEach(part => {
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

        // اضافه کردن اجرت به عنوان یک آیتم
        if (repair.labor > 0) {
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
            sellPrice: repair.labor,
            discount: 0,
            total: repair.labor,
          });
        }

        // ایجاد فاکتور فروش
        const sale = {
          id: uuidv4(),
          invoiceNumber: db.getNextInvoiceNumber(),
          date: new Date().toISOString(),
          time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          customerId: customer.id,
          customerName: repair.customerName,
          sellerId: user?.id || '',
          sellerName: user?.fullName || '',
          items: saleItems,
          subtotal: repair.totalCost,
          discount: 0,
          discountType: 'amount' as const,
          tax: 0,
          total: repair.totalCost,
          paid: repair.totalCost, // کاملاً تسویه شده
          remaining: 0,
          paymentMethod: 'cash' as const,
          status: 'completed' as const,
          notes: `فاکتور تعمیر شماره ${repair.ticketNumber} - ${repair.device} ${repair.brand} ${repair.model}`,
          createdAt: new Date().toISOString(),
        };

        db.saveSale(sale);
        
        // به‌روزرسانی اطلاعات مشتری
        customer.totalPurchase += repair.totalCost;
        customer.totalPaid += repair.totalCost;
        customer.invoiceCount += 1;
        customer.lastPurchase = new Date().toISOString();
        db.saveCustomer(customer);
        
        showToast('success', `فاکتور فروش #${sale.invoiceNumber} برای تعمیر ایجاد و تسویه شد`);
      }
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
                <p className="text-xs text-slate-500">{r.device} {r.brand} {r.model}</p>
                <p className="text-xs text-slate-400">{toJalali(r.entryDate)} | تعمیرکار: {r.technicianName}</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{formatCurrency(r.totalCost, settings.currency)}</p>
                {r.remaining > 0 ? (
                  <p className="text-xs text-red-500">مانده: {formatCurrency(r.remaining, settings.currency)}</p>
                ) : r.status === 'delivered' && (
                  <p className="text-xs text-green-600 font-bold">✓ تسویه شده</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {hasPermission('repairs.edit') && (r.remaining > 0 || r.status !== 'delivered' || user?.role === 'admin') && (
                    <button onClick={() => openEdit(r)} className="text-xs text-blue-500 flex items-center gap-1"><Edit size={12} /> ویرایش</button>
                  )}
                  {r.remaining === 0 && r.status === 'delivered' && user?.role !== 'admin' && (
                    <span className="text-[10px] text-slate-400 italic">فقط مدیر می‌تواند ویرایش کند</span>
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
              </div>
              <div>
                <label className="text-xs text-slate-500">ایراد اعلامی</label>
                <textarea value={form.reportedIssue} onChange={e => setForm({ ...form, reportedIssue: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
              </div>

              {/* Parts */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold">قطعات مصرفی</label>
                  <div className="flex gap-1">
                    <button onClick={addPartFromStock} className="text-xs text-blue-600">+ از انبار</button>
                    <button onClick={addPartManual} className="text-xs text-green-600">+ دستی</button>
                  </div>
                </div>
                {(form.parts || []).map(p => (
                  <div key={p.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded mb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium flex-1">{p.productName}</span>
                      <button onClick={() => removePart(p.id)} className="text-red-500"><X size={12} /></button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">تعداد:</span>
                        <input type="number" value={p.quantity} min="1"
                          onChange={e => updatePartQty(p.id, Number(e.target.value) || 1)}
                          className="w-14 px-1 py-0.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-800" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">قیمت:</span>
                        <input type="number" value={p.price}
                          onChange={e => updatePartPrice(p.id, Number(e.target.value) || 0)}
                          className="w-20 px-1 py-0.5 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-800" />
                      </div>
                      <span className="text-xs font-bold mr-auto">{formatCurrency(p.total, settings.currency)}</span>
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

              {/* تسویه کامل */}
              <label className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer border border-green-200 dark:border-green-800">
                <input type="checkbox" checked={settled} onChange={e => setSettled(e.target.checked)}
                  className="w-5 h-5 rounded text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">تسویه کامل</p>
                  <p className="text-xs text-green-600 dark:text-green-500">با فعال کردن، مبلغ پرداختی = مبلغ کل و فاکتور فروش خودکار ایجاد می‌شود</p>
                </div>
              </label>

              {(() => { const { totalCost } = calcTotal(form); const paidAmount = settled ? totalCost : (Number(form.paid) || 0); const rem = totalCost - paidAmount; return (
                <div className="flex justify-between text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                  <span>جمع کل: {formatCurrency(totalCost, settings.currency)}</span>
                  {rem > 0 && <span className="text-red-500">مانده: {formatCurrency(rem, settings.currency)}</span>}
                  {rem === 0 && settled && <span className="text-green-600 font-bold">✓ تسویه شده</span>}
                </div>
              ); })()}

              <div>
                <label className="text-xs text-slate-500">وضعیت</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Repair['status'] })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                {editRepair ? 'ذخیره تغییرات' : 'ثبت پذیرش'}
              </button>
            </div>
          </div>
        </div>
      )}

      {printRepairId && (
        <RepairPrint repairId={printRepairId} type={printType} onClose={() => setPrintRepairId(null)} />
      )}
    </div>
  );
}

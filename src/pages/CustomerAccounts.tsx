import React, { useState, useEffect } from 'react';
import { useAuth, formatCurrency, toJalali } from '../lib/auth';
import { db, type Customer } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Users, Download, Printer, Edit, DollarSign, History, X, CheckSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface PaymentLog {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  description: string;
  type: 'payment' | 'debt';
}

export default function CustomerAccounts() {
  const { hasPermission } = useAuth();
  const settings = db.getSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState('');

  useEffect(() => {
    setCustomers(db.getCustomers());
    loadPaymentLogs();
  }, []);

  const loadPaymentLogs = () => {
    // بارگذاری لاگ‌های پرداخت از localStorage
    const logs = JSON.parse(localStorage.getItem('idmobile_payment_logs') || '[]');
    setPaymentLogs(logs);
  };

  const savePaymentLog = (log: PaymentLog) => {
    const logs = [...paymentLogs, log];
    localStorage.setItem('idmobile_payment_logs', JSON.stringify(logs));
    setPaymentLogs(logs);
  };

  const filtered = customers.filter(c =>
    c.firstName.includes(search) || c.lastName.includes(search) || c.mobile?.includes(search)
  );

  const totalReceivables = customers.reduce((sum, c) => sum + c.debt, 0);
  const totalCustomers = customers.length;
  const debtorsCount = customers.filter(c => c.debt > 0).length;

  // Aging report
  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    over90: 0,
  };

  customers.forEach(c => {
    if (c.debt <= 0) return;
    const lastPurchase = c.lastPurchase ? new Date(c.lastPurchase) : new Date();
    const daysSince = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 30) aging.current += c.debt;
    else if (daysSince <= 60) aging.days30 += c.debt;
    else if (daysSince <= 90) aging.days60 += c.debt;
    else if (daysSince <= 120) aging.days90 += c.debt;
    else aging.over90 += c.debt;
  });

  const handleSettle = (customer: Customer) => {
    if (!confirm(`آیا از تسویه کامل حساب ${customer.firstName} ${customer.lastName} مطمئن هستید؟`)) return;
    
    customer.debt = 0;
    customer.totalPaid = customer.totalPurchase;
    db.saveCustomer(customer);
    
    // ثبت در لاگ
    const log: PaymentLog = {
      id: uuidv4(),
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      amount: customer.totalPurchase,
      date: new Date().toISOString(),
      description: 'تسویه کامل حساب',
      type: 'payment',
    };
    savePaymentLog(log);
    
    setCustomers([...customers]);
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(customer);
    }
  };

  const handlePayment = () => {
    if (!selectedCustomer || paymentAmount <= 0) return;
    
    selectedCustomer.totalPaid += paymentAmount;
    selectedCustomer.debt -= paymentAmount;
    if (selectedCustomer.debt < 0) selectedCustomer.debt = 0;
    db.saveCustomer(selectedCustomer);
    
    // ثبت در لاگ
    const log: PaymentLog = {
      id: uuidv4(),
      customerId: selectedCustomer.id,
      customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      amount: paymentAmount,
      date: new Date().toISOString(),
      description: paymentDescription || 'پرداخت نقدی',
      type: 'payment',
    };
    savePaymentLog(log);
    
    setCustomers([...customers]);
    setSelectedCustomer({ ...selectedCustomer });
    setShowPaymentModal(false);
    setPaymentAmount(0);
    setPaymentDescription('');
  };

  const exportCSV = () => {
    const headers = ['نام', 'نام خانوادگی', 'موبایل', 'کل خرید', 'پرداخت', 'بدهی', 'تعداد فاکتور'];
    const rows = customers.map(c => [
      c.firstName, c.lastName, c.mobile || '',
      c.totalPurchase.toString(), c.totalPaid.toString(), c.debt.toString(),
      c.invoiceCount.toString(),
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_accounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const printCustomerStatement = (customer: Customer) => {
    const customerLogs = paymentLogs.filter(log => log.customerId === customer.id);
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>صورت حساب ${customer.firstName} ${customer.lastName}</title>
        <style>
          * { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; }
          body { direction: rtl; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #f5f5f5; font-weight: bold; }
          .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.storeName}</h1>
          <p>صورت حساب مشتری</p>
        </div>
        
        <div class="info">
          <p><strong>نام مشتری:</strong> ${customer.firstName} ${customer.lastName}</p>
          <p><strong>شماره تماس:</strong> ${customer.mobile || '-'}</p>
          <p><strong>تاریخ چاپ:</strong> ${toJalali(new Date())}</p>
        </div>
        
        <h2>خلاصه حساب</h2>
        <table>
          <tr>
            <th>شرح</th>
            <th>مبلغ</th>
          </tr>
          <tr>
            <td>کل خرید</td>
            <td>${formatCurrency(customer.totalPurchase, settings.currency)}</td>
          </tr>
          <tr>
            <td>کل پرداختی</td>
            <td>${formatCurrency(customer.totalPaid, settings.currency)}</td>
          </tr>
          <tr>
            <td><strong>مانده بدهی</strong></td>
            <td><strong>${formatCurrency(customer.debt, settings.currency)}</strong></td>
          </tr>
        </table>
        
        <h2>تاریخچه پرداخت‌ها</h2>
        ${customerLogs.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>شرح</th>
                <th>مبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${customerLogs.map(log => `
                <tr>
                  <td>${toJalali(log.date)}</td>
                  <td>${log.description}</td>
                  <td>${formatCurrency(log.amount, settings.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p>هیچ پرداختی ثبت نشده است</p>'}
        
        <div class="footer">
          <p>این صورت حساب به صورت خودکار تولید شده است</p>
          <p>${settings.storeName} - ${settings.storePhone || ''}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">حساب مشتریان</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت حساب‌ها و بدهی مشتریان</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download size={18} />
            اکسل
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={18} />
            چاپ
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تعداد مشتریان</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCustomers}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مشتریان بدهکار</p>
          <p className="text-2xl font-bold text-amber-600">{debtorsCount}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مطالبات</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalReceivables, settings.currency)}</p>
        </div>
      </div>

      {/* Aging Report */}
      <div className="card p-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">گزارش سنی مطالبات</h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جاری</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(aging.current, settings.currency)}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">31-60 روز</p>
            <p className="text-sm font-bold text-blue-600">{formatCurrency(aging.days30, settings.currency)}</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">61-90 روز</p>
            <p className="text-sm font-bold text-amber-600">{formatCurrency(aging.days60, settings.currency)}</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">91-120 روز</p>
            <p className="text-sm font-bold text-orange-600">{formatCurrency(aging.days90, settings.currency)}</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">+120 روز</p>
            <p className="text-sm font-bold text-red-600">{formatCurrency(aging.over90, settings.currency)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-5">
        <div className="relative">
          <Users size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو نام، موبایل..." 
            className="input pr-12"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-bold text-lg text-slate-900 dark:text-white">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{c.mobile}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.invoiceCount} فاکتور</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 dark:text-slate-400">خرید: {formatCurrency(c.totalPurchase, settings.currency)}</p>
                {c.debt > 0 ? (
                  <>
                    <p className="text-lg font-bold text-red-600 mt-1">بدهی: {formatCurrency(c.debt, settings.currency)}</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(c); setShowPaymentModal(true); }}>
                        <DollarSign size={14} />
                        پرداخت
                      </Button>
                      <Button variant="success" size="sm" onClick={() => handleSettle(c)}>
                        <CheckSquare size={14} />
                        تسویه
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-lg font-bold text-green-600 mt-1">تسویه شده ✓</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(c); setShowHistoryModal(true); }}>
                    <History size={14} />
                    تاریخچه
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => printCustomerStatement(c)}>
                    <Printer size={14} />
                    چاپ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Users size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">مشتری‌ای یافت نشد</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                ثبت پرداخت - {selectedCustomer.firstName} {selectedCustomer.lastName}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400">مانده بدهی فعلی</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedCustomer.debt, settings.currency)}</p>
              </div>

              <Input
                label="مبلغ پرداختی"
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                placeholder="مبلغ را وارد کنید"
              />

              <Input
                label="توضیحات"
                value={paymentDescription}
                onChange={e => setPaymentDescription(e.target.value)}
                placeholder="مثال: پرداخت نقدی"
              />

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                  انصراف
                </Button>
                <Button variant="primary" className="flex-1" onClick={handlePayment}>
                  ثبت پرداخت
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                تاریخچه پرداخت‌ها - {selectedCustomer.firstName} {selectedCustomer.lastName}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {paymentLogs.filter(log => log.customerId === selectedCustomer.id).length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <History size={48} className="mx-auto mb-3 opacity-30" />
                  <p>هیچ پرداختی ثبت نشده است</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentLogs
                    .filter(log => log.customerId === selectedCustomer.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(log => (
                      <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{log.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{toJalali(log.date)}</p>
                          </div>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(log.amount, settings.currency)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

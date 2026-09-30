import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useToast, formatCurrency, toJalali, getTimeStr } from '../lib/auth';
import { db, type Product, type Customer, type Sale, type SaleItem } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Trash2, Printer, ShoppingCart, X, UserPlus, ScanBarcode, Eye } from 'lucide-react';
import InvoicePrint from '../components/InvoicePrint';

export default function Sales() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // New sale state
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [imeiInput, setImeiInput] = useState('');
  const [printSaleId, setPrintSaleId] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setSales(db.getSales().filter(s => s.status !== 'proforma').reverse());
  };

  const filteredSales = sales.filter(s =>
    s.invoiceNumber.includes(searchTerm) || s.customerName.includes(searchTerm)
  );

  const subtotal = cartItems.reduce((s, i) => s + i.total, 0);
  const discountAmount = discountType === 'percent' ? Math.round(subtotal * discount / 100) : discount;
  const tax = Math.round((subtotal - discountAmount) * settings.taxRate / 100);
  const total = subtotal - discountAmount + tax;
  const remaining = total - paidAmount;

  const addProductToCart = (product: Product, imei?: string) => {
    if (product.stock <= 0 && !product.imeiRequired) {
      showToast('error', 'موجودی کافی نیست');
      return;
    }
    const existing = cartItems.find(i => i.productId === product.id && !i.imei1);
    if (existing && !product.imeiRequired) {
      setCartItems(cartItems.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.sellPrice } : i));
    } else {
      const newItem: SaleItem = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        model: product.model,
        barcode: product.barcode,
        imei1: imei || '',
        imei2: '',
        quantity: 1,
        buyPrice: hasPermission('sales.view_profit') ? product.buyPrice : 0,
        sellPrice: product.sellPrice,
        discount: 0,
        total: product.sellPrice,
      };
      setCartItems([...cartItems, newItem]);
    }
    setShowProductSearch(false);
    setProductSearch('');
    showToast('success', `${product.name} اضافه شد`);
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeRef.current?.value) {
      const barcode = barcodeRef.current.value.trim();
      const product = db.getProductByBarcode(barcode);
      if (product) {
        addProductToCart(product);
      } else {
        // Check if it's an IMEI
        const serial = db.getSerialByIMEI(barcode);
        if (serial && serial.status === 'available') {
          const product = db.getProduct(serial.productId);
          if (product) addProductToCart(product, barcode);
        } else {
          showToast('error', 'کالا یافت نشد');
        }
      }
      if (barcodeRef.current) barcodeRef.current.value = '';
    }
  };

  const handleIMEISearch = () => {
    if (!imeiInput.trim()) return;
    const serial = db.getSerialByIMEI(imeiInput.trim());
    if (serial && serial.status === 'available') {
      const product = db.getProduct(serial.productId);
      if (product) {
        addProductToCart(product, serial.imei1);
        setImeiInput('');
      }
    } else {
      showToast('error', 'IMEI یافت نشد یا قبلاً فروخته شده');
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(i => i.id !== id));
  };

  const submitSale = () => {
    if (cartItems.length === 0) { showToast('error', 'سبد خرید خالی است'); return; }
    if (!selectedCustomer) { showToast('error', 'مشتری را انتخاب کنید'); return; }

    // Check stock for all items
    for (const item of cartItems) {
      const product = db.getProduct(item.productId);
      if (product && product.stock < item.quantity && !item.imei1) {
        showToast('error', `موجودی ${product.name} کافی نیست`);
        return;
      }
      if (item.imei1) {
        const serial = db.getSerialByIMEI(item.imei1);
        if (!serial || serial.status !== 'available') {
          showToast('error', `IMEI ${item.imei1} در دسترس نیست`);
          return;
        }
      }
    }

    const sale: Sale = {
      id: uuidv4(),
      invoiceNumber: db.getNextInvoiceNumber(),
      date: new Date().toISOString(),
      time: getTimeStr(),
      customerId: selectedCustomer.id,
      customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      sellerId: user?.id || '',
      sellerName: user?.fullName || '',
      items: cartItems,
      subtotal,
      discount: discountAmount,
      discountType,
      tax,
      total,
      paid: paidAmount,
      remaining: remaining > 0 ? remaining : 0,
      paymentMethod,
      status: 'completed',
      notes: saleNotes,
      createdAt: new Date().toISOString(),
    };

    // Save sale
    db.saveSale(sale);

    // Update stock
    cartItems.forEach(item => {
      const product = db.getProduct(item.productId);
      if (product) {
        product.stock -= item.quantity;
        product.updatedAt = new Date().toISOString();
        db.saveProduct(product);

        // Stock movement
        db.saveStockMovement({
          id: uuidv4(),
          productId: product.id,
          productName: product.name,
          type: 'out',
          quantity: item.quantity,
          reference: sale.invoiceNumber,
          referenceType: 'sale',
          referenceId: sale.id,
          userId: user?.id || '',
          userName: user?.fullName || '',
          date: new Date().toISOString(),
          notes: '',
        });
      }

      // Update IMEI status
      if (item.imei1) {
        const serial = db.getSerialByIMEI(item.imei1);
        if (serial) {
          serial.status = 'sold';
          serial.saleId = sale.id;
          db.saveSerial(serial);
        }
      }
    });

    // Update customer
    const customer = db.getCustomer(selectedCustomer.id);
    if (customer) {
      customer.totalPurchase += total;
      customer.totalPaid += paidAmount;
      customer.debt += remaining > 0 ? remaining : 0;
      customer.invoiceCount += 1;
      customer.lastPurchase = new Date().toISOString();
      db.saveCustomer(customer);
    }

    // Audit log
    db.addAuditLog({
      id: uuidv4(), userId: user?.id || '', userName: user?.fullName || '',
      action: 'create_sale', entity: 'sale', entityId: sale.id,
      newValue: `فاکتور #${sale.invoiceNumber} - مبلغ ${total}`,
      ip: '127.0.0.1', date: new Date().toISOString(),
    });

    showToast('success', `فاکتور #${sale.invoiceNumber} ثبت شد`);
    resetForm();
    setView('list');
    loadSales();
    setPrintSaleId(sale.id);
  };

  const resetForm = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setPaidAmount(0);
    setSaleNotes('');
    setPaymentMethod('cash');
  };

  const cancelSale = (saleId: string) => {
    if (!confirm('آیا از لغو این فاکتور مطمئن هستید؟')) return;
    const sale = db.getSale(saleId);
    if (!sale) return;

    sale.status = 'cancelled';
    db.saveSale(sale);

    // Restore stock
    sale.items.forEach(item => {
      const product = db.getProduct(item.productId);
      if (product) {
        product.stock += item.quantity;
        db.saveProduct(product);
        db.saveStockMovement({
          id: uuidv4(), productId: product.id, productName: product.name,
          type: 'in', quantity: item.quantity, reference: sale.invoiceNumber,
          referenceType: 'return', referenceId: sale.id,
          userId: user?.id || '', userName: user?.fullName || '',
          date: new Date().toISOString(), notes: 'مرجوعی - لغو فاکتور',
        });
      }
      if (item.imei1) {
        const serial = db.getSerialByIMEI(item.imei1);
        if (serial) { serial.status = 'returned'; db.saveSerial(serial); }
      }
    });

    // Restore customer
    const customer = db.getCustomer(sale.customerId);
    if (customer) {
      customer.totalPurchase -= sale.total;
      customer.totalPaid -= sale.paid;
      customer.debt -= sale.remaining;
      customer.invoiceCount -= 1;
      db.saveCustomer(customer);
    }

    showToast('success', 'فاکتور لغو شد');
    loadSales();
  };

  const products = db.getProducts().filter(p => p.status === 'active');
  const filteredProducts = products.filter(p =>
    p.name.includes(productSearch) || p.brand.includes(productSearch) || p.barcode?.includes(productSearch) || p.model?.includes(productSearch)
  );
  const customers = db.getCustomers();
  const filteredCustomers = customers.filter(c =>
    c.firstName.includes(customerSearch) || c.lastName.includes(customerSearch) || c.mobile?.includes(customerSearch)
  );

  if (view === 'new') {
    return (
      <div className="space-y-4 pb-20 lg:pb-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">ثبت فروش جدید</h2>
          <button onClick={() => { setView('list'); resetForm(); }} className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 rounded-lg">بازگشت</button>
        </div>

        {/* Barcode Scanner */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <ScanBarcode size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="اسکن بارکد یا IMEI..."
                onKeyDown={handleBarcodeScan}
                className="w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>
            <button onClick={() => setShowProductSearch(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
              <Search size={16} /> جستجو کالا
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={imeiInput}
              onChange={e => setImeiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleIMEISearch()}
              placeholder="جستجو IMEI..."
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleIMEISearch} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm">جستجو IMEI</button>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">مشتری</h3>
            <button onClick={() => setShowCustomerSearch(true)} className="text-xs text-blue-600 flex items-center gap-1">
              <UserPlus size={14} /> انتخاب مشتری
            </button>
          </div>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
              <div>
                <p className="text-sm font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                <p className="text-xs text-slate-500">{selectedCustomer.mobile}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-red-500"><X size={16} /></button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">مشتری انتخاب نشده</p>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <ShoppingCart size={16} /> سبد خرید ({cartItems.length} کالا)
          </h3>
          {cartItems.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">سبد خرید خالی است</p>
          ) : (
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-slate-500">
                      {item.brand} {item.model} {item.imei1 && `| IMEI: ${item.imei1}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      تعداد: {item.quantity} × {formatCurrency(item.sellPrice, settings.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{formatCurrency(item.total, settings.currency)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">جمع کل:</span><span>{formatCurrency(subtotal, settings.currency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">تخفیف:</span><span>{formatCurrency(discountAmount, settings.currency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">مالیات:</span><span>{formatCurrency(tax, settings.currency)}</span></div>
            <div className="flex justify-between font-bold"><span>مبلغ نهایی:</span><span className="text-green-600">{formatCurrency(total, settings.currency)}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">نوع تخفیف</label>
              <div className="flex gap-1 mt-1">
                <button onClick={() => setDiscountType('amount')} className={`flex-1 py-1.5 text-xs rounded ${discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>مبلغی</button>
                <button onClick={() => setDiscountType('percent')} className={`flex-1 py-1.5 text-xs rounded ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>درصدی</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">مقدار تخفیف</label>
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">روش پرداخت</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="w-full mt-1 px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-sm bg-slate-50 dark:bg-slate-700">
                <option value="cash">نقدی</option>
                <option value="card">کارتخوان</option>
                <option value="mixed">ترکیبی</option>
                <option value="credit">نسیه</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">مبلغ پرداختی</label>
              <input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-sm bg-slate-50 dark:bg-slate-700" />
            </div>
          </div>

          {remaining > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-sm text-red-700 dark:text-red-400">
              مانده: {formatCurrency(remaining, settings.currency)}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500">یادداشت</label>
            <textarea value={saleNotes} onChange={e => setSaleNotes(e.target.value)}
              className="w-full mt-1 px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-sm bg-slate-50 dark:bg-slate-700" rows={2} />
          </div>

          <button onClick={submitSale} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Printer size={16} /> ثبت و چاپ فاکتور
          </button>
        </div>

        {/* Product Search Modal */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold">انتخاب کالا</h3>
                <button onClick={() => setShowProductSearch(false)} className="text-slate-500"><X size={20} /></button>
              </div>
              <div className="p-3">
                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder="جستجو نام، برند، بارکد..." className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" autoFocus />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredProducts.slice(0, 20).map(p => (
                  <button key={p.id} onClick={() => addProductToCart(p)}
                    className="w-full p-3 text-right bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.brand} {p.model} | موجودی: {p.stock}</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{formatCurrency(p.sellPrice, settings.currency)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customer Search Modal */}
        {showCustomerSearch && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold">انتخاب مشتری</h3>
                <button onClick={() => setShowCustomerSearch(false)} className="text-slate-500"><X size={20} /></button>
              </div>
              <div className="p-3">
                <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="جستجو نام، موبایل..." className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" autoFocus />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredCustomers.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
                    className="w-full p-3 text-right bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-slate-500">{c.mobile}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sales list view
  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">فاکتورهای فروش</h2>
        {hasPermission('sales.create') && (
          <button onClick={() => setView('new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus size={16} /> فروش جدید
          </button>
        )}
      </div>

      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        placeholder="جستجو شماره فاکتور یا مشتری..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />

      <div className="space-y-2">
        {filteredSales.map(sale => (
          <div key={sale.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">فاکتور #{sale.invoiceNumber}</p>
                <p className="text-xs text-slate-500 mt-1">{sale.customerName} | {toJalali(sale.date)}</p>
                <p className="text-xs text-slate-500">{sale.items.length} کالا | {sale.paymentMethod === 'cash' ? 'نقدی' : sale.paymentMethod === 'card' ? 'کارت' : sale.paymentMethod === 'credit' ? 'نسیه' : 'ترکیبی'}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-green-600">{formatCurrency(sale.total, settings.currency)}</p>
                {sale.remaining > 0 && <p className="text-xs text-red-500">مانده: {formatCurrency(sale.remaining, settings.currency)}</p>}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${sale.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : sale.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-amber-100 text-amber-700'}`}>
                  {sale.status === 'completed' ? 'تکمیل' : sale.status === 'cancelled' ? 'لغو' : 'مرجوع'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {hasPermission('sales.print') && (
                <button onClick={() => setPrintSaleId(sale.id)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <Eye size={12} /> مشاهده/چاپ
                </button>
              )}
              {hasPermission('sales.cancel') && sale.status === 'completed' && (
                <button onClick={() => cancelSale(sale.id)} className="text-xs text-red-500 hover:text-red-700">لغو فاکتور</button>
              )}
            </div>
          </div>
        ))}
        {filteredSales.length === 0 && (
          <p className="text-center text-slate-500 py-8">فاکتوری یافت نشد</p>
        )}
      </div>

      {/* Invoice Print Modal */}
      {printSaleId && (
        <InvoicePrint saleId={printSaleId} onClose={() => setPrintSaleId(null)} />
      )}
    </div>
  );
}

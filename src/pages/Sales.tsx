import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useToast, formatCurrency, toJalali, getTimeStr } from '../lib/auth';
import { db, type Product, type Customer, type Sale, type SaleItem } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Trash2, Printer, ShoppingCart, X, UserPlus, ScanBarcode, Eye, Minus, FileText, CheckSquare, Square } from 'lucide-react';
import InvoicePrint from '../components/InvoicePrint';

export default function Sales() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const settings = db.getSettings();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New sale state
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', model: '', barcode: '', sellPrice: 0, buyPrice: 0, stock: 1
  });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [settled, setSettled] = useState(false); // تسویه کامل
  const [saleNotes, setSaleNotes] = useState('');
  const [imeiInput, setImeiInput] = useState('');
  const [printSaleId, setPrintSaleId] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSales(); }, []);

  const loadSales = () => {
    setSales(db.getSales().filter(s => s.status !== 'proforma').reverse());
  };

  const filteredSales = sales.filter(s => {
    const matchSearch = s.invoiceNumber.includes(searchTerm) || s.customerName.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const subtotal = cartItems.reduce((s, i) => s + i.total, 0);
  const discountAmount = discountType === 'percent' ? Math.round(subtotal * discount / 100) : discount;
  const tax = Math.round((subtotal - discountAmount) * settings.taxRate / 100);
  const total = subtotal - discountAmount + tax;
  const remaining = total - paidAmount;

  // تسویه کامل خودکار
  useEffect(() => {
    if (settled) {
      setPaidAmount(total);
    }
  }, [settled, total]);

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

  // تغییر تعداد دستی
  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(cartItems.map(i => i.id === id ? { ...i, quantity: newQty, total: newQty * i.sellPrice } : i));
  };

  // تغییر قیمت دستی
  const updatePrice = (id: string, newPrice: number) => {
    setCartItems(cartItems.map(i => i.id === id ? { ...i, sellPrice: newPrice, total: i.quantity * newPrice } : i));
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeRef.current?.value) {
      const barcode = barcodeRef.current.value.trim();
      const product = db.getProductByBarcode(barcode);
      if (product) {
        addProductToCart(product);
      } else {
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

  const addNewProduct = () => {
    if (!newProduct.name.trim()) {
      showToast('error', 'نام کالا الزامی است');
      return;
    }
    if (!newProduct.sellPrice || newProduct.sellPrice <= 0) {
      showToast('error', 'قیمت فروش الزامی است');
      return;
    }

    const product: Product = {
      id: uuidv4(),
      name: newProduct.name,
      brand: newProduct.brand,
      model: newProduct.model,
      category: 'متفرقه',
      sku: '',
      barcode: newProduct.barcode || '',
      imeiRequired: false,
      serialRequired: false,
      color: '',
      storage: '',
      description: '',
      buyPrice: newProduct.buyPrice || 0,
      sellPrice: newProduct.sellPrice,
      minStock: 1,
      stock: newProduct.stock || 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveProduct(product);

    // Add to cart
    const newItem: SaleItem = {
      id: uuidv4(),
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      model: product.model,
      barcode: product.barcode,
      imei1: '',
      imei2: '',
      quantity: 1,
      buyPrice: hasPermission('sales.view_profit') ? product.buyPrice : 0,
      sellPrice: product.sellPrice,
      discount: 0,
      total: product.sellPrice,
    };
    setCartItems([...cartItems, newItem]);

    showToast('success', `${product.name} اضافه و به سبد اضافه شد`);
    setShowAddProduct(false);
    setNewProduct({ name: '', brand: '', model: '', barcode: '', sellPrice: 0, buyPrice: 0, stock: 1 });
  };

  const submitSale = () => {
    if (cartItems.length === 0) { showToast('error', 'سبد خرید خالی است'); return; }
    if (!selectedCustomer) { showToast('error', 'مشتری را انتخاب کنید'); return; }

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

    const finalPaid = settled ? total : paidAmount;
    const finalRemaining = total - finalPaid;

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
      paid: finalPaid,
      remaining: finalRemaining > 0 ? finalRemaining : 0,
      paymentMethod,
      status: 'completed',
      notes: saleNotes,
      createdAt: new Date().toISOString(),
    };

    db.saveSale(sale);

    cartItems.forEach(item => {
      const product = db.getProduct(item.productId);
      if (product) {
        product.stock -= item.quantity;
        product.updatedAt = new Date().toISOString();
        db.saveProduct(product);
        db.saveStockMovement({
          id: uuidv4(), productId: product.id, productName: product.name,
          type: 'out', quantity: item.quantity, reference: sale.invoiceNumber,
          referenceType: 'sale', referenceId: sale.id,
          userId: user?.id || '', userName: user?.fullName || '',
          date: new Date().toISOString(), notes: '',
        });
      }
      if (item.imei1) {
        const serial = db.getSerialByIMEI(item.imei1);
        if (serial) { serial.status = 'sold'; serial.saleId = sale.id; db.saveSerial(serial); }
      }
    });

    const customer = db.getCustomer(selectedCustomer.id);
    if (customer) {
      customer.totalPurchase += total;
      customer.totalPaid += finalPaid;
      customer.debt += finalRemaining > 0 ? finalRemaining : 0;
      customer.invoiceCount += 1;
      customer.lastPurchase = new Date().toISOString();
      db.saveCustomer(customer);
    }

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
    setSettled(false);
    setSaleNotes('');
    setPaymentMethod('cash');
  };

  const cancelSale = (saleId: string) => {
    if (!confirm('آیا از لغو این فاکتور مطمئن هستید؟')) return;
    const sale = db.getSale(saleId);
    if (!sale) return;
    sale.status = 'cancelled';
    db.saveSale(sale);
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

  // New Sale Form
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
              <input ref={barcodeRef} type="text" placeholder="اسکن بارکد یا IMEI..."
                onKeyDown={handleBarcodeScan}
                className="w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" autoFocus />
            </div>
            <button onClick={() => setShowProductSearch(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
              <Search size={16} /> کالا
            </button>
            <button onClick={() => setShowAddProduct(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
              <Plus size={16} /> کالای جدید
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <input type="text" value={imeiInput} onChange={e => setImeiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleIMEISearch()}
              placeholder="جستجو IMEI..."
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleIMEISearch} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm">IMEI</button>
          </div>
        </div>

        {/* Customer */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">مشتری</h3>
            <button onClick={() => setShowCustomerSearch(true)} className="text-xs text-blue-600 flex items-center gap-1">
              <UserPlus size={14} /> انتخاب
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

        {/* Cart with quantity control */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <ShoppingCart size={16} /> سبد خرید ({cartItems.length} کالا)
          </h3>
          {cartItems.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">سبد خرید خالی است</p>
          ) : (
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.brand} {item.model}</p>
                      {item.imei1 && <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">IMEI: {item.imei1}</p>}
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r">
                        <Minus size={14} />
                      </button>
                      <input type="number" value={item.quantity}
                        onChange={e => updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                        className="w-12 text-center text-sm bg-transparent focus:outline-none" min="1" />
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l">
                        <Plus size={14} />
                      </button>
                    </div>
                    {/* Price */}
                    <div className="flex items-center gap-1">
                      <input type="number" value={item.sellPrice}
                        onChange={e => updatePrice(item.id, Number(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                      <span className="text-xs text-slate-500">تومان</span>
                    </div>
                    <div className="mr-auto">
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(item.total, settings.currency)}</p>
                    </div>
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
            <div className="flex justify-between font-bold text-base"><span>مبلغ نهایی:</span><span className="text-green-600">{formatCurrency(total, settings.currency)}</span></div>
          </div>

          {/* تسویه کامل */}
          <label className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer border border-green-200 dark:border-green-800">
            <input type="checkbox" checked={settled} onChange={e => setSettled(e.target.checked)}
              className="w-5 h-5 rounded text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-700 dark:text-green-400">تسویه کامل</p>
              <p className="text-xs text-green-600 dark:text-green-500">با فعال کردن، مبلغ پرداختی = مبلغ کل</p>
            </div>
            {settled && <CheckSquare size={20} className="text-green-600" />}
            {!settled && <Square size={20} className="text-slate-400" />}
          </label>

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
              <input type="number" value={paidAmount} onChange={e => { setPaidAmount(Number(e.target.value)); setSettled(false); }}
                disabled={settled}
                className="w-full mt-1 px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-sm bg-slate-50 dark:bg-slate-700 disabled:opacity-50" />
            </div>
          </div>

          {remaining > 0 && !settled && (
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
                  placeholder="جستجو..." className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" autoFocus />
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
                  placeholder="جستجو..." className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" autoFocus />
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

        {printSaleId && <InvoicePrint saleId={printSaleId} onClose={() => setPrintSaleId(null)} />}

        {/* Add New Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold">افزودن کالای جدید</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-slate-500"><X size={20} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-500">نام کالا *</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">برند</label>
                    <input type="text" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">مدل</label>
                    <input type="text" value={newProduct.model} onChange={e => setNewProduct({ ...newProduct, model: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">بارکد</label>
                  <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">قیمت خرید</label>
                    <input type="number" value={newProduct.buyPrice} onChange={e => setNewProduct({ ...newProduct, buyPrice: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">قیمت فروش *</label>
                    <input type="number" value={newProduct.sellPrice} onChange={e => setNewProduct({ ...newProduct, sellPrice: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">موجودی اولیه</label>
                  <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700" />
                </div>
                <button onClick={addNewProduct} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
                  افزودن و اضافه به سبد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sales list view (merged with invoices)
  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">فروش و فاکتورها</h2>
        {hasPermission('sales.create') && (
          <button onClick={() => setView('new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus size={16} /> فروش جدید
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="جستجو شماره فاکتور یا مشتری..." className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
          <option value="all">همه</option>
          <option value="completed">تکمیل شده</option>
          <option value="cancelled">لغو شده</option>
          <option value="returned">مرجوعی</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">تعداد فاکتور</p>
          <p className="text-lg font-bold">{filteredSales.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">جمع فروش</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(filteredSales.reduce((s, x) => s + x.total, 0), settings.currency)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500">مانده بدهی</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(filteredSales.reduce((s, x) => s + x.remaining, 0), settings.currency)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {filteredSales.map(sale => (
          <div key={sale.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">فاکتور #{sale.invoiceNumber}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${sale.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : sale.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-amber-100 text-amber-700'}`}>
                    {sale.status === 'completed' ? 'تکمیل' : sale.status === 'cancelled' ? 'لغو' : 'مرجوع'}
                  </span>
                  {sale.remaining === 0 && sale.status === 'completed' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">تسویه ✓</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{sale.customerName} | {toJalali(sale.date)} - {sale.time}</p>
                <p className="text-xs text-slate-500">{sale.items.length} کالا | {sale.sellerName}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-green-600">{formatCurrency(sale.total, settings.currency)}</p>
                {sale.remaining > 0 && <p className="text-xs text-red-500">مانده: {formatCurrency(sale.remaining, settings.currency)}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              {hasPermission('sales.print') && (
                <button onClick={() => setPrintSaleId(sale.id)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <Eye size={12} /> مشاهده/چاپ
                </button>
              )}
              {hasPermission('sales.cancel') && sale.status === 'completed' && (
                <button onClick={() => cancelSale(sale.id)} className="text-xs text-red-500 hover:text-red-700">لغو</button>
              )}
            </div>
          </div>
        ))}
        {filteredSales.length === 0 && (
          <p className="text-center text-slate-500 py-8">فاکتوری یافت نشد</p>
        )}
      </div>

      {printSaleId && <InvoicePrint saleId={printSaleId} onClose={() => setPrintSaleId(null)} />}
    </div>
  );
}

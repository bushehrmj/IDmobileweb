import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth, useToast, formatCurrency } from '../lib/auth';
import { db, type Product, type Customer, type Sale, type SaleItem } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Plus, Search, Trash2, Printer, ShoppingCart, X, 
  UserPlus, ScanBarcode, Eye, Minus, CreditCard, 
  Banknote, CheckSquare, Square, Barcode, Users, Package, Edit,
  DollarSign, FileText, History
} from 'lucide-react';
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
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: ''
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', model: '', barcode: '', sellPrice: 0, buyPrice: 0, stock: 1
  });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [settled, setSettled] = useState(false);
  const [saleNotes, setSaleNotes] = useState('');
  const [imeiInput, setImeiInput] = useState('');
  const [printSaleId, setPrintSaleId] = useState<string | null>(null);
  const [editSaleId, setEditSaleId] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    loadSales(); 
  }, []);

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

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(cartItems.map(i => i.id === id ? { ...i, quantity: newQty, total: newQty * i.sellPrice } : i));
  };

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
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
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
    if (!confirm('آیا از لغو این فاکتور مطمئن هستید؟\n\nاین عملیات غیرقابل بازگشت است و موجودی کالاها به انبار بازگردانده می‌شود.')) {
      return;
    }

    const sale = db.getSale(saleId);
    if (!sale) {
      showToast('error', 'فاکتور یافت نشد');
      return;
    }

    if (sale.status === 'cancelled') {
      showToast('warning', 'این فاکتور قبلاً لغو شده است');
      return;
    }

    try {
      // تغییر وضعیت فاکتور به لغو شده
      sale.status = 'cancelled';
      db.saveSale(sale);

      // بازگرداندن موجودی کالاها به انبار
      sale.items.forEach(item => {
        if (item.productId) {
          const product = db.getProduct(item.productId);
          if (product) {
            product.stock += item.quantity;
            product.updatedAt = new Date().toISOString();
            db.saveProduct(product);
            
            // ثبت حرکت انبار
            db.saveStockMovement({
              id: uuidv4(),
              productId: product.id,
              productName: product.name,
              type: 'in',
              quantity: item.quantity,
              reference: sale.invoiceNumber,
              referenceType: 'return',
              referenceId: sale.id,
              userId: user?.id || '',
              userName: user?.fullName || '',
              date: new Date().toISOString(),
              notes: 'مرجوعی - لغو فاکتور',
            });
          }
        }
        
        // بازگرداندن وضعیت IMEI
        if (item.imei1) {
          const serial = db.getSerialByIMEI(item.imei1);
          if (serial) {
            serial.status = 'returned';
            db.saveSerial(serial);
          }
        }
      });

      // به‌روزرسانی اطلاعات مشتری
      if (sale.customerId) {
        const customer = db.getCustomer(sale.customerId);
        if (customer) {
          customer.totalPurchase = Math.max(0, customer.totalPurchase - sale.total);
          customer.totalPaid = Math.max(0, customer.totalPaid - sale.paid);
          customer.debt = Math.max(0, customer.debt - sale.remaining);
          customer.invoiceCount = Math.max(0, customer.invoiceCount - 1);
          db.saveCustomer(customer);
        }
      }

      // ثبت در لاگ
      db.addAuditLog({
        id: uuidv4(),
        userId: user?.id || '',
        userName: user?.fullName || '',
        action: 'cancel_sale',
        entity: 'sale',
        entityId: sale.id,
        oldValue: `فاکتور #${sale.invoiceNumber} - مبلغ ${sale.total}`,
        newValue: 'لغو شد',
        ip: '127.0.0.1',
        date: new Date().toISOString(),
      });

      showToast('success', `فاکتور #${sale.invoiceNumber} با موفقیت لغو شد`);
      loadSales();
    } catch (error) {
      console.error('Error canceling sale:', error);
      showToast('error', 'خطا در لغو فاکتور');
    }
  };

  const updateSale = (saleId: string, updates: Partial<Sale>) => {
    const sale = db.getSale(saleId);
    if (!sale) return;
    
    const oldSale = { ...sale };
    
    // به‌روزرسانی فیلدها
    Object.assign(sale, updates);
    
    // محاسبه مجدد totals
    if (updates.discount !== undefined || updates.items) {
      const subtotal = sale.items.reduce((sum, item) => sum + item.total, 0);
      sale.subtotal = subtotal;
      
      const discountAmount = sale.discountType === 'percent' 
        ? Math.round(subtotal * sale.discount / 100) 
        : sale.discount;
      sale.discount = discountAmount;
      
      const tax = Math.round((subtotal - discountAmount) * settings.taxRate / 100);
      sale.tax = tax;
      
      const total = subtotal - discountAmount + tax;
      sale.total = total;
      
      // به‌روزرسانی remaining
      sale.remaining = total - sale.paid;
      if (sale.remaining < 0) sale.remaining = 0;
    }
    
    // به‌روزرسانی customer
    if (updates.paid !== undefined) {
      const customer = db.getCustomer(sale.customerId);
      if (customer) {
        const paidDiff = sale.paid - oldSale.paid;
        customer.totalPaid += paidDiff;
        customer.debt -= paidDiff;
        if (customer.debt < 0) customer.debt = 0;
        db.saveCustomer(customer);
      }
    }
    
    db.saveSale(sale);
    
    // Audit log
    db.addAuditLog({
      id: uuidv4(), userId: user?.id || '', userName: user?.fullName || '',
      action: 'edit_sale', entity: 'sale', entityId: sale.id,
      oldValue: JSON.stringify(oldSale),
      newValue: JSON.stringify(sale),
      ip: '127.0.0.1', date: new Date().toISOString(),
    });
    
    showToast('success', 'فاکتور ویرایش شد');
    loadSales();
  };

  const addNewCustomer = () => {
    if (!newCustomer.firstName.trim() && !newCustomer.lastName.trim()) {
      showToast('error', 'نام مشتری الزامی است');
      return;
    }
    if (!newCustomer.mobile.trim()) {
      showToast('error', 'شماره موبایل الزامی است');
      return;
    }

    const customer: Customer = {
      id: uuidv4(),
      firstName: newCustomer.firstName,
      lastName: newCustomer.lastName,
      mobile: newCustomer.mobile,
      nationalId: newCustomer.nationalId,
      address: newCustomer.address,
      notes: newCustomer.notes,
      totalPurchase: 0,
      totalPaid: 0,
      debt: 0,
      invoiceCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveCustomer(customer);
    setSelectedCustomer(customer);
    setShowAddCustomer(false);
    setNewCustomer({ firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: '' });
    showToast('success', 'مشتری جدید اضافه شد');
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
      <div className="space-y-4 pb-20 lg:pb-0 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">فروش جدید</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ثبت فاکتور فروش جدید</p>
          </div>
          <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
            بازگشت به لیست
          </Button>
        </div>

        {/* Barcode Scanner */}
        <div className="card p-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="اسکن بارکد یا IMEI..."
                onKeyDown={handleBarcodeScan}
                className="input pr-12"
                autoFocus
              />
            </div>
            <Button variant="primary" onClick={() => setShowProductSearch(true)}>
              <Search size={18} />
              جستجو کالا
            </Button>
            <Button variant="success" onClick={() => setShowAddProduct(true)}>
              <Plus size={18} />
              کالای جدید
            </Button>
          </div>
          <div className="flex gap-3 mt-3">
            <input
              type="text"
              value={imeiInput}
              onChange={e => setImeiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleIMEISearch()}
              placeholder="جستجو IMEI..."
              className="input flex-1"
            />
            <Button variant="secondary" onClick={handleIMEISearch}>
              جستجو IMEI
            </Button>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">مشتری</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCustomerSearch(true)}>
                <UserPlus size={16} />
                انتخاب مشتری
              </Button>
              <Button variant="success" size="sm" onClick={() => setShowAddCustomer(true)}>
                <Plus size={16} />
                مشتری جدید
              </Button>
            </div>
          </div>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{selectedCustomer.mobile}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>مشتری انتخاب نشده است</p>
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card p-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-500" />
            سبد خرید ({cartItems.length} کالا)
          </h3>
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <ShoppingCart size={64} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">سبد خرید خالی است</p>
              <p className="text-sm mt-1">محصولات را با اسکن بارکد یا جستجو اضافه کنید</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.brand} {item.model}</p>
                      {item.imei1 && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-mono mt-1">
                          IMEI: {item.imei1}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-600">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg"
                      >
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={e => updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 text-center text-sm bg-transparent focus:outline-none" 
                        min="1" 
                      />
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={item.sellPrice}
                        onChange={e => updatePrice(item.id, Number(e.target.value) || 0)}
                        className="w-32 px-3 py-2 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800" 
                      />
                      <span className="text-xs text-slate-500">تومان</span>
                    </div>
                    <div className="mr-auto">
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(item.total, settings.currency)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="card p-5 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">پرداخت</h3>
          
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">جمع کل:</span>
              <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">تخفیف:</span>
              <span className="font-bold text-red-600">{formatCurrency(discountAmount, settings.currency)}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">مالیات:</span>
              <span className="font-bold">{formatCurrency(tax, settings.currency)}</span>
            </div>
            <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <span className="font-bold">مبلغ نهایی:</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(total, settings.currency)}</span>
            </div>
          </div>

          {/* Settle Complete */}
          <label className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl cursor-pointer border-2 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <input 
              type="checkbox" 
              checked={settled} 
              onChange={e => setSettled(e.target.checked)}
              className="w-5 h-5 rounded text-green-600" 
            />
            <div className="flex-1">
              <p className="font-bold text-green-700 dark:text-green-400">تسویه کامل</p>
              <p className="text-xs text-green-600 dark:text-green-500">با فعال کردن، مبلغ پرداختی = مبلغ کل</p>
            </div>
            {settled ? <CheckSquare size={24} className="text-green-600" /> : <Square size={24} className="text-slate-400" />}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نوع تخفیف</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDiscountType('amount')} 
                  className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                    discountType === 'amount' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  مبلغی
                </button>
                <button 
                  onClick={() => setDiscountType('percent')} 
                  className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                    discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  درصدی
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">مقدار تخفیف</label>
              <input 
                type="number" 
                value={discount} 
                onChange={e => setDiscount(Number(e.target.value))}
                className="input" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">روش پرداخت</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="input"
              >
                <option value="cash">نقدی</option>
                <option value="card">کارتخوان</option>
                <option value="mixed">ترکیبی</option>
                <option value="credit">نسیه</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">مبلغ پرداختی</label>
              <input 
                type="number" 
                value={paidAmount} 
                onChange={e => { setPaidAmount(Number(e.target.value)); setSettled(false); }}
                disabled={settled}
                className="input disabled:opacity-50 disabled:cursor-not-allowed" 
              />
            </div>
          </div>

          {remaining > 0 && !settled && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">
                مانده: {formatCurrency(remaining, settings.currency)}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">یادداشت</label>
            <textarea 
              value={saleNotes} 
              onChange={e => setSaleNotes(e.target.value)}
              className="input" 
              rows={2} 
            />
          </div>

          <Button 
            variant="success" 
            size="lg" 
            className="w-full"
            onClick={submitSale}
          >
            <Printer size={20} />
            ثبت و چاپ فاکتور
          </Button>
        </div>

        {/* Product Search Modal */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-scaleIn">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-xl font-bold">انتخاب کالا</h3>
                <button onClick={() => setShowProductSearch(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <div className="p-4">
                <input 
                  ref={productSearchRef}
                  type="text" 
                  value={productSearch} 
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="جستجو نام، برند، بارکد..." 
                  className="input" 
                  autoFocus 
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredProducts.slice(0, 20).map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => addProductToCart(p)}
                    className="w-full p-4 text-right bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {p.brand} {p.model} | موجودی: {p.stock}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      {formatCurrency(p.sellPrice, settings.currency)}
                    </p>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Package size={48} className="mx-auto mb-2 opacity-30" />
                    <p>کالایی یافت نشد</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Search Modal */}
        {showCustomerSearch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-scaleIn">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-xl font-bold">انتخاب مشتری</h3>
                <button onClick={() => setShowCustomerSearch(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <div className="p-4">
                <input 
                  type="text" 
                  value={customerSearch} 
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="جستجو نام، موبایل..." 
                  className="input" 
                  autoFocus 
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredCustomers.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
                    className="w-full p-4 text-right bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{c.mobile}</p>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Users size={48} className="mx-auto mb-2 opacity-30" />
                    <p>مشتری‌ای یافت نشد</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add New Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-xl font-bold">ثبت مشتری جدید</h3>
                <button onClick={() => { setShowAddCustomer(false); setNewCustomer({ firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: '' }); }} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="نام *"
                    value={newCustomer.firstName}
                    onChange={e => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    placeholder="مثال: علی"
                    autoFocus
                  />
                  <Input
                    label="نام خانوادگی"
                    value={newCustomer.lastName}
                    onChange={e => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    placeholder="مثال: محمدی"
                  />
                </div>
                <Input
                  label="شماره موبایل *"
                  type="tel"
                  value={newCustomer.mobile}
                  onChange={e => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                  placeholder="09121234567"
                />
                <Input
                  label="کد ملی"
                  value={newCustomer.nationalId}
                  onChange={e => setNewCustomer({ ...newCustomer, nationalId: e.target.value })}
                  placeholder="0012345678"
                />
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">آدرس</label>
                  <textarea
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="آدرس کامل..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">یادداشت</label>
                  <textarea
                    value={newCustomer.notes}
                    onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="توضیحات اضافی..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowAddCustomer(false); setNewCustomer({ firstName: '', lastName: '', mobile: '', nationalId: '', address: '', notes: '' }); }}>
                    انصراف
                  </Button>
                  <Button variant="success" className="flex-1" onClick={addNewCustomer}>
                    <UserPlus size={18} />
                    ثبت و انتخاب
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-scaleIn">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-xl font-bold">افزودن کالای جدید</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <Input
                  label="نام کالا *"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="مثال: iPhone 13"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="برند"
                    value={newProduct.brand}
                    onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                    placeholder="Apple"
                  />
                  <Input
                    label="مدل"
                    value={newProduct.model}
                    onChange={e => setNewProduct({ ...newProduct, model: e.target.value })}
                    placeholder="Pro Max"
                  />
                </div>
                <Input
                  label="بارکد"
                  value={newProduct.barcode}
                  onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="قیمت خرید"
                    type="number"
                    value={newProduct.buyPrice}
                    onChange={e => setNewProduct({ ...newProduct, buyPrice: Number(e.target.value) })}
                  />
                  <Input
                    label="قیمت فروش *"
                    type="number"
                    value={newProduct.sellPrice}
                    onChange={e => setNewProduct({ ...newProduct, sellPrice: Number(e.target.value) })}
                  />
                </div>
                <Input
                  label="موجودی اولیه"
                  type="number"
                  value={newProduct.stock}
                  onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                />
                <Button variant="success" size="lg" className="w-full" onClick={addNewProduct}>
                  افزودن و اضافه به سبد
                </Button>
              </div>
            </div>
          </div>
        )}

        {printSaleId && <InvoicePrint saleId={printSaleId} onClose={() => setPrintSaleId(null)} />}
      </div>
    );
  }

  // Sales list view
  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">فروش و فاکتورها</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت فاکتورهای فروش</p>
        </div>
        {hasPermission('sales.create') && (
          <Button variant="primary" onClick={() => setView('new')}>
            <Plus size={18} />
            فروش جدید
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="جستجو شماره فاکتور یا مشتری..." 
            className="input pr-12" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">همه</option>
          <option value="completed">تکمیل شده</option>
          <option value="cancelled">لغو شده</option>
          <option value="returned">مرجوعی</option>
        </select>
      </div>

      {/* Stats - فقط فاکتورهای completed را محاسبه کن */}
      {(() => {
        const completedSales = filteredSales.filter(s => s.status === 'completed');
        return (
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تعداد فاکتور</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedSales.length}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">جمع فروش</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(completedSales.reduce((s, x) => s + x.total, 0), settings.currency)}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مانده بدهی</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(completedSales.reduce((s, x) => s + x.remaining, 0), settings.currency)}
              </p>
            </div>
          </div>
        );
      })()}

      <div className="space-y-3">
        {filteredSales.map(sale => (
          <div key={sale.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-bold text-lg text-slate-900 dark:text-white">
                    فاکتور #{sale.invoiceNumber}
                  </p>
                  <span className={`badge ${
                    sale.status === 'completed' ? 'badge-success' : 
                    sale.status === 'cancelled' ? 'badge-error' : 'badge-warning'
                  }`}>
                    {sale.status === 'completed' ? 'تکمیل' : sale.status === 'cancelled' ? 'لغو' : 'مرجوع'}
                  </span>
                  {sale.remaining === 0 && sale.status === 'completed' && (
                    <span className="badge badge-info">تسویه ✓</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {sale.customerName} | {new Date(sale.date).toLocaleDateString('fa-IR')} - {sale.time}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {sale.items.length} کالا | {sale.sellerName}
                </p>
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(sale.total, settings.currency)}
                </p>
                {sale.remaining > 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    مانده: {formatCurrency(sale.remaining, settings.currency)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              {hasPermission('sales.edit') && sale.status !== 'cancelled' && (
                <Button variant="outline" size="sm" onClick={() => setEditSaleId(sale.id)}>
                  <Edit size={14} />
                  ویرایش
                </Button>
              )}
              {hasPermission('sales.print') && (
                <Button variant="outline" size="sm" onClick={() => setPrintSaleId(sale.id)}>
                  <Eye size={14} />
                  مشاهده/چاپ
                </Button>
              )}
              {hasPermission('sales.cancel') && sale.status === 'completed' && (
                <Button variant="danger" size="sm" onClick={() => cancelSale(sale.id)}>
                  لغو فاکتور
                </Button>
              )}
            </div>
          </div>
        ))}
        {filteredSales.length === 0 && (
          <div className="card p-12 text-center">
            <ShoppingCart size={64} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">فاکتوری یافت نشد</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {searchTerm ? 'جستجوی خود را تغییر دهید' : 'اولین فاکتور فروش را ثبت کنید'}
            </p>
          </div>
        )}
      </div>

      {printSaleId && <InvoicePrint saleId={printSaleId} onClose={() => setPrintSaleId(null)} />}
      
      {/* Edit Sale Modal */}
      {editSaleId && (() => {
        const sale = db.getSale(editSaleId);
        if (!sale) return null;
        
        return (
          <EditSaleModal
            sale={sale}
            onClose={() => setEditSaleId(null)}
            onSave={(updates) => {
              updateSale(editSaleId, updates);
              setEditSaleId(null);
            }}
          />
        );
      })()}
    </div>
  );
}

// Edit Sale Modal Component
function EditSaleModal({ sale, onClose, onSave }: { 
  sale: Sale; 
  onClose: () => void; 
  onSave: (updates: Partial<Sale>) => void 
}) {
  const [discount, setDiscount] = useState(sale.discount);
  const [discountType, setDiscountType] = useState(sale.discountType);
  const [paid, setPaid] = useState(sale.paid);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod);
  const [notes, setNotes] = useState(sale.notes);
  const [status, setStatus] = useState(sale.status);
  const [settled, setSettled] = useState(sale.remaining === 0);

  const settings = db.getSettings();

  // محاسبه مبلغ نهایی
  const subtotal = sale.subtotal;
  const discountAmount = discountType === 'percent' 
    ? Math.round(subtotal * discount / 100) 
    : discount;
  const tax = Math.round((subtotal - discountAmount) * settings.taxRate / 100);
  const total = subtotal - discountAmount + tax;

  // تسویه خودکار
  useEffect(() => {
    if (settled) {
      setPaid(total);
    }
  }, [settled, total]);

  const handleSave = () => {
    const finalPaid = settled ? total : paid;
    onSave({
      discount,
      discountType,
      paid: finalPaid,
      paymentMethod,
      notes,
      status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            ویرایش فاکتور #{sale.invoiceNumber}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Customer Info (Read-only) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">مشتری</p>
            <p className="font-bold text-slate-900 dark:text-white">{sale.customerName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {new Date(sale.date).toLocaleDateString('fa-IR')} - {sale.time}
            </p>
          </div>

          {/* Items (Read-only) */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">کالاها</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sale.items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-slate-500">تعداد: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(item.total, settings.currency)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">نوع تخفیف</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as 'amount' | 'percent')}
                className="input"
              >
                <option value="amount">مبلغی</option>
                <option value="percent">درصدی</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">مقدار تخفیف</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">مبلغ پرداختی</label>
              <input
                type="number"
                value={paid}
                onChange={e => { setPaid(Number(e.target.value)); setSettled(false); }}
                disabled={settled}
                className="input disabled:bg-slate-100 dark:disabled:bg-slate-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">روش پرداخت</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as Sale['paymentMethod'])}
                className="input"
              >
                <option value="cash">نقدی</option>
                <option value="card">کارتخوان</option>
                <option value="mixed">ترکیبی</option>
                <option value="credit">نسیه</option>
              </select>
            </div>
          </div>

          {/* تیک تسویه کامل */}
          <label className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <input
              type="checkbox"
              checked={settled}
              onChange={e => setSettled(e.target.checked)}
              className="w-5 h-5 rounded text-green-600 focus:ring-2 focus:ring-green-500"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-700 dark:text-green-400">تسویه کامل</p>
              <p className="text-xs text-green-600 dark:text-green-500">
                با فعال کردن این گزینه، مبلغ پرداختی برابر مبلغ نهایی می‌شود
              </p>
            </div>
            {settled && (
              <div className="text-green-600 dark:text-green-400">
                <CheckSquare size={24} />
              </div>
            )}
          </label>

          {/* نمایش مانده */}
          {total - paid > 0 && !settled && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">مانده بدهی:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(total - paid, settings.currency)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">وضعیت</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Sale['status'])}
              className="input"
            >
              <option value="completed">تکمیل شده</option>
              <option value="returned">مرجوعی</option>
              <option value="cancelled">لغو شده</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">یادداشت</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input"
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>جمع کل:</span>
                <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>تخفیف:</span>
                  <span>- {formatCurrency(discountAmount, settings.currency)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>مالیات:</span>
                  <span>{formatCurrency(tax, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-blue-300 dark:border-blue-700 pt-2">
                <span>مبلغ نهایی:</span>
                <span className="text-blue-600">{formatCurrency(total, settings.currency)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300 dark:border-blue-700">
                <span>پرداخت شده:</span>
                <span className="font-bold text-green-600">{formatCurrency(settled ? total : paid, settings.currency)}</span>
              </div>
              {total - (settled ? total : paid) > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>مانده:</span>
                  <span>{formatCurrency(total - (settled ? total : paid), settings.currency)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              انصراف
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

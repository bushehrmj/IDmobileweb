// Database Layer - localStorage based, designed for backend swap
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'manager' | 'seller' | 'technician' | 'warehouse';
  permissions: string[];
  visiblePages: string[];
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  maxDiscount?: number;
  avatar?: string;
}

export interface Session {
  id: string;
  userId: string;
  username: string;
  role: string;
  loginTime: string;
  lastActivity: string;
  device: string;
  ip: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  sku: string;
  barcode: string;
  imeiRequired: boolean;
  serialRequired: boolean;
  color: string;
  storage: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
  stock: number;
  status: 'active' | 'inactive';
  dollarRateAtPurchase?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSerial {
  id: string;
  productId: string;
  imei1: string;
  imei2: string;
  serial: string;
  status: 'available' | 'sold' | 'returned' | 'repair' | 'transfer';
  purchaseId?: string;
  saleId?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  nationalId: string;
  address: string;
  notes: string;
  totalPurchase: number;
  totalPaid: number;
  debt: number;
  invoiceCount: number;
  lastPurchase?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percent';
  tax: number;
  total: number;
  paid: number;
  remaining: number;
  paymentMethod: 'cash' | 'card' | 'mixed' | 'credit';
  status: 'completed' | 'cancelled' | 'returned' | 'proforma';
  notes: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  model: string;
  barcode: string;
  imei1: string;
  imei2: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  discount: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  total: number;
  paid: number;
  remaining: number;
  dollarRate: number;
  notes: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  buyPrice: number;
  total: number;
  imeis: string[];
}

export interface Repair {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerMobile: string;
  device: string;
  brand: string;
  model: string;
  imei: string;
  serial: string;
  color: string;
  physicalCondition: string;
  accessories: string;
  devicePassword: string;
  reportedIssue: string;
  diagnosis: string;
  parts: RepairPart[];
  labor: number;
  partsCost: number;
  extraCost: number;
  totalCost: number;
  paid: number;
  remaining: number;
  technicianId: string;
  technicianName: string;
  status: 'received' | 'waiting_check' | 'repairing' | 'waiting_part' | 'ready' | 'delivered' | 'cancelled';
  entryDate: string;
  deliveryDate?: string;
  notes: string;
  createdAt: string;
}

export interface RepairPart {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'repair';
  quantity: number;
  reference: string;
  referenceType: 'purchase' | 'sale' | 'repair' | 'adjustment' | 'return';
  referenceId: string;
  userId: string;
  userName: string;
  date: string;
  notes: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  type: 'received' | 'paid';
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  reference: string;
  referenceType: 'sale' | 'purchase' | 'repair';
  referenceId: string;
  userId: string;
  date: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ip: string;
  date: string;
}

export interface Settings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeDescription: string;
  logo: string;
  currency: string;
  taxRate: number;
  invoiceStartNumber: number;
  repairStartNumber: number;
  sessionTimeout: number;
  theme: 'light' | 'dark';
  paperSize: '80mm' | 'a5' | 'a4';
  defaultProfitPercent: number;
  // Invoice settings
  showLogoOnInvoice: boolean;
  showStorePhone: boolean;
  showStoreAddress: boolean;
  showCustomerInfo: boolean;
  showSellerName: boolean;
  showIMEI: boolean;
  showBarcode: boolean;
  showTax: boolean;
  showDiscount: boolean;
  showNotes: boolean;
  showFooter: boolean;
  invoiceFooterText: string;
  invoiceHeaderNote: string;
  showProfitOnInvoice: boolean;
  receiptPaperSize: '80mm' | 'a5' | 'a4';
}

export interface LoginAttempt {
  username: string;
  attempts: number;
  lastAttempt: string;
  locked: boolean;
  lockUntil?: string;
}

const DB_PREFIX = 'idmobile_';

function getCollection<T>(name: string): T[] {
  try {
    const data = localStorage.getItem(DB_PREFIX + name);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setCollection<T>(name: string, data: T[]): void {
  localStorage.setItem(DB_PREFIX + name, JSON.stringify(data));
}

function getSingle<T>(name: string): T | null {
  try {
    const data = localStorage.getItem(DB_PREFIX + name);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function setSingle<T>(name: string, data: T): void {
  localStorage.setItem(DB_PREFIX + name, JSON.stringify(data));
}

// Simple hash function for passwords (in production, use bcrypt on server)
export function hashPassword(password: string): string {
  let hash = 0;
  const salt = 'idmobile_salt_2024';
  const salted = salt + password + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(salted).slice(0, 20);
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Initialize database with default data
export function initializeDB(): void {
  const initialized = localStorage.getItem(DB_PREFIX + 'initialized');
  if (initialized) {
    // Migration: Update admin user with new financial permissions
    const users = getCollection<User>('users');
    const adminUser = users.find(u => u.username === 'admin');
    if (adminUser) {
      const allPerms = getAllPermissions();
      const missingPerms = allPerms.filter(p => !adminUser.permissions.includes(p));
      if (missingPerms.length > 0) {
        adminUser.permissions = allPerms;
        adminUser.visiblePages = getAllPages();
        const idx = users.findIndex(u => u.id === adminUser.id);
        users[idx] = adminUser;
        setCollection('users', users);
      }
    }
    return;
  }

  // Default admin user
  const adminUser: User = {
    id: uuidv4(),
    username: 'admin',
    passwordHash: hashPassword('ChangeMe123!'),
    fullName: 'مدیر سیستم',
    role: 'admin',
    permissions: getAllPermissions(),
    visiblePages: getAllPages(),
    active: true,
    createdAt: new Date().toISOString(),
    maxDiscount: 100,
  };

  setCollection('users', [adminUser]);

  // Default settings
  const defaultSettings: Settings = {
    storeName: 'ID Mobile',
    storePhone: '',
    storeAddress: '',
    storeDescription: 'فروشگاه موبایل',
    logo: '',
    currency: 'تومان',
    taxRate: 0,
    invoiceStartNumber: 1001,
    repairStartNumber: 5001,
    sessionTimeout: 30,
    theme: 'light',
    paperSize: '80mm',
    defaultProfitPercent: 15,
    showLogoOnInvoice: true,
    showStorePhone: true,
    showStoreAddress: true,
    showCustomerInfo: true,
    showSellerName: true,
    showIMEI: true,
    showBarcode: false,
    showTax: true,
    showDiscount: true,
    showNotes: true,
    showFooter: true,
    invoiceFooterText: 'از خرید شما متشکریم',
    invoiceHeaderNote: '',
    showProfitOnInvoice: false,
    receiptPaperSize: '80mm',
  };
  setSingle('settings', defaultSettings);

  // Initialize collections
  setCollection('sessions', []);
  setCollection('products', []);
  setCollection('product_serials', []);
  setCollection('customers', []);
  setCollection('sales', []);
  setCollection('purchases', []);
  setCollection('repairs', []);
  setCollection('stock_movements', []);
  setCollection('payments', []);
  setCollection('audit_logs', []);
  setCollection('login_attempts', []);

  localStorage.setItem(DB_PREFIX + 'initialized', 'true');
}

// All permissions
export function getAllPermissions(): string[] {
  return [
    'dashboard.view',
    'sales.view', 'sales.create', 'sales.edit', 'sales.cancel', 'sales.print',
    'sales.discount', 'sales.change_price', 'sales.view_profit',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'inventory.view', 'inventory.adjust',
    'purchases.view', 'purchases.create', 'purchases.edit',
    'customers.view', 'customers.create', 'customers.edit',
    'repairs.view', 'repairs.create', 'repairs.edit', 'repairs.close',
    'reports.view', 'reports.financial', 'reports.profit',
    'users.view', 'users.create', 'users.edit', 'users.disable',
    'settings.view', 'settings.edit',
    'backup.create', 'backup.restore',
    // Financial permissions
    'financial.view', 'financial.dashboard', 'financial.cash', 'financial.bank',
    'financial.receivables', 'financial.payables', 'financial.expenses',
    'financial.reports', 'financial.profit', 'financial.balance_sheet',
    'financial.journal', 'financial.chart_of_accounts', 'financial.reconciliation',
    'financial.close_period', 'financial.export', 'financial.audit',
  ];
}

export function getAllPages(): string[] {
  return ['dashboard', 'sales', 'invoices', 'proformas', 'customers', 'products', 'inventory', 'purchases', 'suppliers', 'repairs', 'payments', 'reports', 'users', 'settings', 'backup', 'financial', 'cashbank', 'expenses', 'financialreports', 'chartofaccounts', 'generalledger', 'checks', 'transfers', 'customeraccounts', 'supplieraccounts'];
}

export function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'admin': return getAllPermissions();
    case 'manager': return getAllPermissions().filter(p => !p.startsWith('backup.') && !p.startsWith('financial.close_period'));
    case 'seller': return [
      'dashboard.view', 'sales.view', 'sales.create', 'sales.edit', 'sales.print', 'sales.discount',
      'customers.view', 'customers.create', 'customers.edit',
      'products.view',
    ];
    case 'technician': return [
      'dashboard.view', 'repairs.view', 'repairs.create', 'repairs.edit', 'repairs.close',
      'customers.view', 'customers.create', 'customers.edit',
      'products.view',
    ];
    case 'warehouse': return [
      'dashboard.view', 'products.view', 'products.create', 'products.edit',
      'inventory.view', 'inventory.adjust',
      'purchases.view', 'purchases.create', 'purchases.edit',
    ];
    default: return [];
  }
}

export function getRolePages(role: string): string[] {
  switch (role) {
    case 'admin': case 'manager': return getAllPages();
    case 'seller': return ['dashboard', 'sales', 'invoices', 'customers', 'products'];
    case 'technician': return ['dashboard', 'repairs', 'customers'];
    case 'warehouse': return ['dashboard', 'products', 'inventory', 'purchases'];
    default: return ['dashboard'];
  }
}

// DB Operations
export const db = {
  // Users
  getUsers: (): User[] => getCollection<User>('users'),
  getUser: (id: string): User | undefined => getCollection<User>('users').find(u => u.id === id),
  getUserByUsername: (username: string): User | undefined => getCollection<User>('users').find(u => u.username === username),
  saveUser: (user: User): void => {
    const users = getCollection<User>('users');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user; else users.push(user);
    setCollection('users', users);
  },
  deleteUser: (id: string): void => {
    setCollection('users', getCollection<User>('users').filter(u => u.id !== id));
  },

  // Sessions
  getSessions: (): Session[] => getCollection<Session>('sessions'),
  getActiveSessions: (): Session[] => getCollection<Session>('sessions').filter(s => s.active),
  saveSession: (session: Session): void => {
    const sessions = getCollection<Session>('sessions');
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = session; else sessions.push(session);
    setCollection('sessions', sessions);
  },
  endSession: (id: string): void => {
    const sessions = getCollection<Session>('sessions');
    const s = sessions.find(s => s.id === id);
    if (s) { s.active = false; setCollection('sessions', sessions); }
  },

  // Products
  getProducts: (): Product[] => getCollection<Product>('products'),
  getProduct: (id: string): Product | undefined => getCollection<Product>('products').find(p => p.id === id),
  getProductByBarcode: (barcode: string): Product | undefined => getCollection<Product>('products').find(p => p.barcode === barcode),
  saveProduct: (product: Product): void => {
    const products = getCollection<Product>('products');
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) products[idx] = product; else products.push(product);
    setCollection('products', products);
  },
  deleteProduct: (id: string): void => {
    setCollection('products', getCollection<Product>('products').filter(p => p.id !== id));
  },

  // Product Serials (IMEI)
  getSerials: (): ProductSerial[] => getCollection<ProductSerial>('product_serials'),
  getSerialByIMEI: (imei: string): ProductSerial | undefined => getCollection<ProductSerial>('product_serials').find(s => s.imei1 === imei || s.imei2 === imei),
  getSerialsByProduct: (productId: string): ProductSerial[] => getCollection<ProductSerial>('product_serials').filter(s => s.productId === productId),
  saveSerial: (serial: ProductSerial): void => {
    const serials = getCollection<ProductSerial>('product_serials');
    const idx = serials.findIndex(s => s.id === serial.id);
    if (idx >= 0) serials[idx] = serial; else serials.push(serial);
    setCollection('product_serials', serials);
  },

  // Customers
  getCustomers: (): Customer[] => getCollection<Customer>('customers'),
  getCustomer: (id: string): Customer | undefined => getCollection<Customer>('customers').find(c => c.id === id),
  saveCustomer: (customer: Customer): void => {
    const customers = getCollection<Customer>('customers');
    const idx = customers.findIndex(c => c.id === customer.id);
    if (idx >= 0) customers[idx] = customer; else customers.push(customer);
    setCollection('customers', customers);
  },
  deleteCustomer: (id: string): void => {
    setCollection('customers', getCollection<Customer>('customers').filter(c => c.id !== id));
  },

  // Sales
  getSales: (): Sale[] => getCollection<Sale>('sales'),
  getSale: (id: string): Sale | undefined => getCollection<Sale>('sales').find(s => s.id === id),
  saveSale: (sale: Sale): void => {
    const sales = getCollection<Sale>('sales');
    const idx = sales.findIndex(s => s.id === sale.id);
    if (idx >= 0) sales[idx] = sale; else sales.push(sale);
    setCollection('sales', sales);
  },

  // Purchases
  getPurchases: (): Purchase[] => getCollection<Purchase>('purchases'),
  getPurchase: (id: string): Purchase | undefined => getCollection<Purchase>('purchases').find(p => p.id === id),
  savePurchase: (purchase: Purchase): void => {
    const purchases = getCollection<Purchase>('purchases');
    const idx = purchases.findIndex(p => p.id === purchase.id);
    if (idx >= 0) purchases[idx] = purchase; else purchases.push(purchase);
    setCollection('purchases', purchases);
  },

  // Repairs
  getRepairs: (): Repair[] => getCollection<Repair>('repairs'),
  getRepair: (id: string): Repair | undefined => getCollection<Repair>('repairs').find(r => r.id === id),
  saveRepair: (repair: Repair): void => {
    const repairs = getCollection<Repair>('repairs');
    const idx = repairs.findIndex(r => r.id === repair.id);
    if (idx >= 0) repairs[idx] = repair; else repairs.push(repair);
    setCollection('repairs', repairs);
  },

  // Stock Movements
  getStockMovements: (): StockMovement[] => getCollection<StockMovement>('stock_movements'),
  saveStockMovement: (movement: StockMovement): void => {
    const movements = getCollection<StockMovement>('stock_movements');
    movements.push(movement);
    setCollection('stock_movements', movements);
  },

  // Payments
  getPayments: (): Payment[] => getCollection<Payment>('payments'),
  savePayment: (payment: Payment): void => {
    const payments = getCollection<Payment>('payments');
    payments.push(payment);
    setCollection('payments', payments);
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => getCollection<AuditLog>('audit_logs'),
  addAuditLog: (log: AuditLog): void => {
    const logs = getCollection<AuditLog>('audit_logs');
    logs.unshift(log);
    if (logs.length > 5000) logs.length = 5000;
    setCollection('audit_logs', logs);
  },

  // Settings
  getSettings: (): Settings => {
    const s = getSingle<Settings>('settings');
    const defaults: Settings = {
      storeName: 'ID Mobile', storePhone: '', storeAddress: '', storeDescription: '',
      logo: '', currency: 'تومان', taxRate: 0, invoiceStartNumber: 1001,
      repairStartNumber: 5001, sessionTimeout: 30, theme: 'light', paperSize: '80mm',
      defaultProfitPercent: 15,
      showLogoOnInvoice: true, showStorePhone: true, showStoreAddress: true,
      showCustomerInfo: true, showSellerName: true, showIMEI: true, showBarcode: false,
      showTax: true, showDiscount: true, showNotes: true, showFooter: true,
      invoiceFooterText: 'از خرید شما متشکریم', invoiceHeaderNote: '',
      showProfitOnInvoice: false, receiptPaperSize: '80mm',
    };
    if (!s) return defaults;
    return { ...defaults, ...s };
  },
  saveSettings: (settings: Settings): void => setSingle('settings', settings),

  // Login Attempts
  getLoginAttempt: (username: string): LoginAttempt | undefined => {
    return getCollection<LoginAttempt>('login_attempts').find(a => a.username === username);
  },
  saveLoginAttempt: (attempt: LoginAttempt): void => {
    const attempts = getCollection<LoginAttempt>('login_attempts');
    const idx = attempts.findIndex(a => a.username === attempt.username);
    if (idx >= 0) attempts[idx] = attempt; else attempts.push(attempt);
    setCollection('login_attempts', attempts);
  },

  // Backup
  exportAll: (): string => {
    const data: Record<string, unknown> = {};
    const keys = ['users', 'products', 'product_serials', 'customers', 'sales', 'purchases', 'repairs', 'stock_movements', 'payments', 'audit_logs', 'settings', 'sessions'];
    keys.forEach(key => {
      data[key] = localStorage.getItem(DB_PREFIX + key);
    });
    data['exportDate'] = new Date().toISOString();
    data['version'] = '1.0.0';
    return JSON.stringify(data, null, 2);
  },

  importAll: (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      const keys = ['users', 'products', 'product_serials', 'customers', 'sales', 'purchases', 'repairs', 'stock_movements', 'payments', 'audit_logs', 'settings', 'sessions'];
      keys.forEach(key => {
        if (data[key]) localStorage.setItem(DB_PREFIX + key, data[key]);
      });
      return true;
    } catch { return false; }
  },

  resetAll: (): void => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(DB_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    initializeDB();
  },

  // Generate next invoice number
  getNextInvoiceNumber: (): string => {
    const settings = db.getSettings();
    const sales = getCollection<Sale>('sales');
    const maxNum = sales.reduce((max, s) => {
      const num = parseInt(s.invoiceNumber) || 0;
      return num > max ? num : max;
    }, settings.invoiceStartNumber - 1);
    return String(maxNum + 1);
  },

  getNextRepairNumber: (): string => {
    const settings = db.getSettings();
    const repairs = getCollection<Repair>('repairs');
    const maxNum = repairs.reduce((max, r) => {
      const num = parseInt(r.ticketNumber) || 0;
      return num > max ? num : max;
    }, settings.repairStartNumber - 1);
    return String(maxNum + 1);
  },
};

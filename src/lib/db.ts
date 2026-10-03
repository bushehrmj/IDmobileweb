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
  // فیلدهای جدید برای سیستم انبار حرفه‌ای
  averageBuyPrice?: number; // میانگین بهای خرید (Weighted Average)
  lastBuyPrice?: number; // آخرین قیمت خرید
  totalPurchaseValue?: number; // ارزش کل خریدها
  totalPurchaseQuantity?: number; // تعداد کل خریدها
  suggestedPurchaseQuantity?: number; // مقدار پیشنهادی خرید
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
  
  // اطلاعات مشتری
  customerName: string;
  customerMobile: string;
  customerMobile2?: string;
  customerNationalId?: string;
  customerAddress?: string;
  customerNotes?: string;
  
  // اطلاعات دستگاه
  deviceType: 'mobile' | 'tablet' | 'watch' | 'laptop' | 'other';
  device: string;
  brand: string;
  model: string;
  color: string;
  storage?: string;
  ram?: string;
  imei: string;
  imei2?: string;
  serial: string;
  
  // وضعیت ظاهری
  physicalCondition: PhysicalConditionChecklist;
  
  // عکس‌ها
  photos?: DevicePhoto[];
  
  // لوازم همراه
  accessories: AccessoriesChecklist;
  
  // اطلاعات نرم‌افزاری
  devicePassword?: string;
  passwordType?: 'pattern' | 'pin' | 'faceid' | 'touchid' | 'none';
  passwordProvided: boolean;
  devicePowerStatus?: 'on' | 'off';
  
  // سیم‌کارت و حافظه
  sim1?: boolean;
  sim2?: boolean;
  memoryCard?: boolean;
  
  // ایراد و تشخیص
  reportedIssue: string;
  initialAssessment?: string;
  diagnosis: string;
  
  // تست اولیه
  initialTests?: TestChecklist;
  testNotPerformedReason?: string;
  
  // خدمات
  requestedServices: string[];
  otherServiceDescription?: string;
  
  // هزینه
  estimatedPartsCost: number;
  estimatedLabor: number;
  estimatedExtraCost: number;
  estimatedTotal: number;
  customerCostApproval?: CostApproval;
  
  // قطعات و هزینه نهایی
  parts: RepairPart[];
  labor: number;
  partsCost: number;
  extraCost: number;
  totalCost: number;
  discount: number;
  finalTotal: number;
  
  // پرداخت
  paid: number;
  remaining: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'bank' | 'check' | 'credit';
  
  // گارانتی
  warranty?: WarrantyInfo;
  
  // امضاها
  signatures?: RepairSignatures;
  
  // تأییدها
  confirmations: RepairConfirmations;
  
  // هشدارها
  warnings: RepairWarnings;
  
  // زمان تحویل
  estimatedDeliveryDate?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  
  // وضعیت
  status: RepairStatus;
  technicianId: string;
  technicianName: string;
  
  // تاریخچه
  entryDate: string;
  entryTime: string;
  history?: RepairHistoryEntry[];
  
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PhysicalConditionChecklist {
  screen: ConditionStatus;
  backCover: ConditionStatus;
  frame: ConditionStatus;
  edges: ConditionStatus;
  camera: ConditionStatus;
  cameraLens: ConditionStatus;
  chargingPort: ConditionStatus;
  speaker: ConditionStatus;
  microphone: ConditionStatus;
  buttons: ConditionStatus;
  simTray: ConditionStatus;
  battery: ConditionStatus;
  waterDamage: boolean;
  impactDamage: boolean;
  previouslyOpened: boolean;
  previouslyReplacedParts: boolean;
  glueOrCracks: boolean;
}

export type ConditionStatus = 'healthy' | 'scratched' | 'broken' | 'damaged' | 'unknown';

export interface DevicePhoto {
  id: string;
  type: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'imei';
  data: string; // base64
  timestamp: string;
}

export interface AccessoriesChecklist {
  phone: boolean;
  case: boolean;
  charger: boolean;
  cable: boolean;
  simCard: boolean;
  memoryCard: boolean;
  stylus: boolean;
  headphones: boolean;
  box: boolean;
  other: boolean;
  otherDescription?: string;
}

export interface TestChecklist {
  power: TestStatus;
  touch: TestStatus;
  display: TestStatus;
  backlight: TestStatus;
  charging: TestStatus;
  camera: TestStatus;
  flash: TestStatus;
  microphone: TestStatus;
  speaker: TestStatus;
  earpiece: TestStatus;
  wifi: TestStatus;
  bluetooth: TestStatus;
  sim: TestStatus;
  mobileNetwork: TestStatus;
  fingerprint: TestStatus;
  faceId: TestStatus;
  buttons: TestStatus;
  vibration: TestStatus;
  proximitySensor: TestStatus;
  gps: TestStatus;
  nfc: TestStatus;
  battery: TestStatus;
}

export type TestStatus = 'passed' | 'failed' | 'not_tested' | 'not_testable';

export interface CostApproval {
  approved: boolean;
  date: string;
  time: string;
  approvedBy: string;
  method: 'in_person' | 'phone' | 'sms' | 'other';
  notes?: string;
}

export interface WarrantyInfo {
  hasWarranty: boolean;
  duration: number; // days
  startDate: string;
  endDate: string;
  coveredParts: string[];
  coveredServices: string[];
  excludedItems: string[];
  terms: string;
}

export interface RepairSignatures {
  customerSignature?: string; // base64
  acceptanceSignature?: string;
  technicianSignature?: string;
  customerSignatureDate?: string;
}

export interface RepairConfirmations {
  conditionChecked: boolean;
  accessoriesRegistered: boolean;
  issueReported: boolean;
  costEstimated: boolean;
  dataLossInformed: boolean;
  warrantyInformed: boolean;
  receiptReceived: boolean;
  serviceAgreed: boolean;
}

export interface RepairWarnings {
  waterDamageWarning: boolean;
  boardRepairWarning: boolean;
  previouslyOpenedWarning: boolean;
  dataBackupWarning: boolean;
  partsAvailabilityWarning: boolean;
}

export type RepairStatus = 
  | 'received'
  | 'waiting_check'
  | 'diagnosing'
  | 'waiting_customer_approval'
  | 'repairing'
  | 'waiting_part'
  | 'completed'
  | 'ready_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'not_repairable';

export interface RepairHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
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
  type: 'in' | 'out' | 'adjustment' | 'return' | 'repair' | 'damage' | 'transfer';
  quantity: number;
  reference: string;
  referenceType: 'purchase' | 'sale' | 'repair' | 'adjustment' | 'return' | 'damage' | 'transfer';
  referenceId: string;
  userId: string;
  userName: string;
  date: string;
  notes: string;
  // فیلدهای جدید برای ردیابی کامل
  previousStock?: number; // موجودی قبل از عملیات
  newStock?: number; // موجودی بعد از عملیات
  unitPrice?: number; // قیمت واحد در زمان عملیات
  totalPrice?: number; // قیمت کل در زمان عملیات
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  type: 'received' | 'paid';
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'check' | 'other';
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
  
  // Always run migration to update permissions and pages
  const users = getCollection<User>('users');
  if (users.length > 0) {
    let updated = false;
    users.forEach(user => {
      const rolePerms = getRolePermissions(user.role);
      const rolePages = getRolePages(user.role);
      const allPages = getAllPages();
      
      // Update permissions
      const missingPerms = rolePerms.filter(p => !user.permissions.includes(p));
      if (missingPerms.length > 0) {
        user.permissions = rolePerms;
        updated = true;
      }
      
      // Update visible pages - ensure all new pages are included
      const missingPages = allPages.filter(p => !user.visiblePages.includes(p));
      if (missingPages.length > 0) {
        user.visiblePages = allPages;
        updated = true;
      }
    });
    
    if (updated) {
      setCollection('users', users);
      console.log('✅ User permissions and pages updated');
    }
  }
  
  if (initialized) {
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
  return [
    'dashboard', 
    'sales', 
    'invoices', 
    'proformas', 
    'customers', 
    'products', 
    'inventory', 
    'purchases', 
    'suppliers', 
    'repairs', 
    'payments', 
    'reports', 
    'users', 
    'settings', 
    'backup', 
    'financial', 
    'cashbank', 
    'expenses', 
    'financialreports', 
    'chartofaccounts', 
    'generalledger', 
    'checks', 
    'transfers', 
    'customeraccounts', 
    'supplieraccounts',
    'salescharts',
    'profile',
    'printsettings',
    'printhistory',
    'apistatus',
    'migration',
    'comprehensivereport'
  ];
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

// ============================================
// Inventory Helper Functions
// ============================================

/**
 * محاسبه میانگین بهای خرید (Weighted Average Cost)
 */
export function calculateAverageBuyPrice(productId: string): number {
  const movements = getCollection<StockMovement>('stock_movements')
    .filter(m => m.productId === productId && m.type === 'in' && m.unitPrice);
  
  if (movements.length === 0) {
    const product = getCollection<Product>('products').find(p => p.id === productId);
    return product?.buyPrice || 0;
  }

  let totalCost = 0;
  let totalQuantity = 0;

  movements.forEach(m => {
    totalCost += (m.unitPrice || 0) * m.quantity;
    totalQuantity += m.quantity;
  });

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

/**
 * به‌روزرسانی میانگین بهای خرید محصول
 */
export function updateProductAveragePrice(productId: string): void {
  const products = getCollection<Product>('products');
  const product = products.find(p => p.id === productId);
  
  if (product) {
    product.averageBuyPrice = calculateAverageBuyPrice(productId);
    product.totalPurchaseValue = product.averageBuyPrice * product.stock;
    
    // محاسبه مقدار پیشنهادی خرید
    if (product.stock < product.minStock) {
      product.suggestedPurchaseQuantity = product.minStock * 2 - product.stock;
    } else {
      product.suggestedPurchaseQuantity = 0;
    }
    
    const idx = products.findIndex(p => p.id === productId);
    products[idx] = product;
    setCollection('products', products);
  }
}

/**
 * ثبت حرکت انبار با اطلاعات کامل
 */
export function recordStockMovement(
  productId: string,
  productName: string,
  type: StockMovement['type'],
  quantity: number,
  reference: string,
  referenceType: StockMovement['referenceType'],
  referenceId: string,
  userId: string,
  userName: string,
  notes: string = '',
  unitPrice?: number
): StockMovement {
  const products = getCollection<Product>('products');
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  const previousStock = product.stock;
  let newStock = previousStock;

  // محاسبه موجودی جدید
  if (type === 'in' || type === 'return') {
    newStock = previousStock + quantity;
  } else if (type === 'out' || type === 'repair' || type === 'damage') {
    newStock = previousStock - quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }
  } else if (type === 'adjustment') {
    newStock = quantity; // quantity در این حالت موجودی جدید است
    quantity = newStock - previousStock;
  }

  // به‌روزرسانی موجودی محصول
  product.stock = newStock;
  product.updatedAt = new Date().toISOString();
  
  // به‌روزرسانی آخرین قیمت خرید
  if (type === 'in' && unitPrice) {
    product.lastBuyPrice = unitPrice;
    product.totalPurchaseQuantity = (product.totalPurchaseQuantity || 0) + Math.abs(quantity);
  }
  
  const idx = products.findIndex(p => p.id === productId);
  products[idx] = product;
  setCollection('products', products);

  // ثبت حرکت انبار
  const movement: StockMovement = {
    id: uuidv4(),
    productId,
    productName,
    type,
    quantity: Math.abs(quantity),
    reference,
    referenceType,
    referenceId,
    userId,
    userName,
    date: new Date().toISOString(),
    notes,
    previousStock,
    newStock,
    unitPrice: unitPrice || product.buyPrice,
    totalPrice: (unitPrice || product.buyPrice) * Math.abs(quantity),
  };

  const movements = getCollection<StockMovement>('stock_movements');
  movements.push(movement);
  setCollection('stock_movements', movements);

  // به‌روزرسانی میانگین بهای خرید
  if (type === 'in') {
    updateProductAveragePrice(productId);
  }

  return movement;
}

/**
 * دریافت وضعیت موجودی محصول
 */
export function getStockStatus(product: Product): 'out' | 'low' | 'ok' {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.minStock) return 'low';
  return 'ok';
}

/**
 * دریافت تاریخچه گردش کالای خاص
 */
export function getProductMovementHistory(productId: string): StockMovement[] {
  return getCollection<StockMovement>('stock_movements')
    .filter(m => m.productId === productId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * محاسبه ارزش کل موجودی
 */
export function calculateTotalInventoryValue(): number {
  const products = getCollection<Product>('products');
  return products.reduce((sum, p) => {
    const avgPrice = p.averageBuyPrice || p.buyPrice;
    return sum + (avgPrice * p.stock);
  }, 0);
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

  // Inventory Helper Functions
  calculateAverageBuyPrice,
  updateProductAveragePrice,
  recordStockMovement,
  getStockStatus,
  getProductMovementHistory,
  calculateTotalInventoryValue,
};

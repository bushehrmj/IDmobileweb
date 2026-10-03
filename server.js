/**
 * ID Mobile Manager Pro - Unified Server
 * Serves both Frontend and Backend API
 * Uses sql.js (pure JavaScript SQLite)
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'id-mobile-manager-secret-key-2024';
const DIST_DIR = path.join(__dirname, 'dist');
const DB_PATH = path.join(__dirname, 'data', 'idmobile.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(DIST_DIR));

// Database Setup
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

// Helper to generate UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize Database
async function initializeDatabase() {
  console.log('📦 Initializing database...');
  
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ Database loaded from file');
  } else {
    db = new SQL.Database();
    console.log('✅ New database created');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT NOT NULL,
      visible_pages TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      last_login TEXT,
      max_discount REAL DEFAULT 0,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      login_time TEXT NOT NULL,
      last_activity TEXT NOT NULL,
      device TEXT,
      ip TEXT,
      active INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      category TEXT,
      sku TEXT,
      barcode TEXT,
      imei_required INTEGER DEFAULT 0,
      serial_required INTEGER DEFAULT 0,
      color TEXT,
      storage TEXT,
      description TEXT,
      buy_price REAL DEFAULT 0,
      sell_price REAL DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      dollar_rate_at_purchase REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS product_serials (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      imei1 TEXT,
      imei2 TEXT,
      serial TEXT,
      status TEXT DEFAULT 'available',
      purchase_id TEXT,
      sale_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT,
      mobile TEXT,
      national_id TEXT,
      address TEXT,
      notes TEXT,
      total_purchase REAL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      debt REAL DEFAULT 0,
      invoice_count INTEGER DEFAULT 0,
      last_purchase TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      seller_id TEXT,
      seller_name TEXT,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'amount',
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      barcode TEXT,
      imei1 TEXT,
      imei2 TEXT,
      quantity INTEGER DEFAULT 1,
      buy_price REAL DEFAULT 0,
      sell_price REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      supplier_id TEXT,
      supplier_name TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0,
      dollar_rate REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      buy_price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      imeis TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS repairs (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_mobile TEXT,
      device TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      imei TEXT,
      serial TEXT,
      color TEXT,
      physical_condition TEXT,
      accessories TEXT,
      device_password TEXT,
      reported_issue TEXT,
      diagnosis TEXT,
      parts TEXT,
      labor REAL DEFAULT 0,
      parts_cost REAL DEFAULT 0,
      extra_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0,
      technician_id TEXT,
      technician_name TEXT,
      status TEXT DEFAULT 'received',
      entry_date TEXT,
      delivery_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reference TEXT,
      reference_type TEXT,
      reference_id TEXT,
      user_id TEXT,
      user_name TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'cash',
      reference TEXT,
      reference_type TEXT,
      reference_id TEXT,
      user_id TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_product_serials_imei1 ON product_serials(imei1)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_repairs_ticket_number ON repairs(ticket_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(date)`);

  // Create default admin user
  const result = db.exec("SELECT id FROM users WHERE username = 'admin'");
  if (result.length === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.run(
      `INSERT INTO users (id, username, password_hash, full_name, role, permissions, visible_pages, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'admin', passwordHash, 'مدیر سیستم', 'admin', JSON.stringify(['*']), JSON.stringify(['*']), 1]
    );
    console.log('✅ Default admin user created');
    console.log('   Username: admin');
    console.log('   Password: admin123');
  }

  // Save database to file
  saveDatabase();
  console.log('✅ Database schema initialized');
}

// Save database to file
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper to query all rows
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper to query one row
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Permission Middleware
function checkPermission(permission) {
  return (req, res, next) => {
    const userPermissions = JSON.parse(req.user.permissions || '[]');
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'sql.js' });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = queryOne('SELECT * FROM users WHERE username = ? AND active = 1', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        permissions: user.permissions 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    db.run('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), user.id]);

    // Create session
    const sessionId = uuidv4();
    db.run(
      `INSERT INTO sessions (id, user_id, username, role, login_time, last_activity, device, ip, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, user.id, user.username, user.role, new Date().toISOString(), new Date().toISOString(), req.headers['user-agent'], req.ip, 1]
    );

    saveDatabase();

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        permissions: JSON.parse(user.permissions),
        visiblePages: JSON.parse(user.visible_pages)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  try {
    db.run('UPDATE sessions SET active = 0 WHERE user_id = ?', [req.user.id]);
    saveDatabase();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      permissions: JSON.parse(user.permissions),
      visiblePages: JSON.parse(user.visible_pages)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Products Routes
app.get('/api/products', authenticateToken, (req, res) => {
  try {
    const products = queryAll('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', authenticateToken, (req, res) => {
  try {
    const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', authenticateToken, checkPermission('products.create'), (req, res) => {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO products (id, name, brand, model, category, sku, barcode, imei_required, serial_required, 
                           color, storage, description, buy_price, sell_price, min_stock, stock, status, 
                           dollar_rate_at_purchase, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.body.name, req.body.brand || '', req.body.model || '', req.body.category || '',
        req.body.sku || '', req.body.barcode || '', req.body.imeiRequired ? 1 : 0, req.body.serialRequired ? 1 : 0,
        req.body.color || '', req.body.storage || '', req.body.description || '',
        req.body.buyPrice || 0, req.body.sellPrice || 0, req.body.minStock || 0, req.body.stock || 0,
        req.body.status || 'active', req.body.dollarRateAtPurchase || null, now, now
      ]
    );

    saveDatabase();
    res.json({ id, message: 'Product created successfully' });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Customers Routes
app.get('/api/customers', authenticateToken, (req, res) => {
  try {
    const customers = queryAll('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', authenticateToken, checkPermission('customers.create'), (req, res) => {
  try {
    const id = uuidv4();
    
    db.run(
      `INSERT INTO customers (id, first_name, last_name, mobile, national_id, address, notes, 
                            total_purchase, total_paid, debt, invoice_count, last_purchase, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.body.firstName, req.body.lastName || '', req.body.mobile || '',
        req.body.nationalId || '', req.body.address || '', req.body.notes || '',
        0, 0, 0, 0, null, new Date().toISOString()
      ]
    );

    saveDatabase();
    res.json({ id, message: 'Customer created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Products - Update
app.put('/api/products/:id', authenticateToken, checkPermission('products.edit'), (req, res) => {
  try {
    const now = new Date().toISOString();
    
    db.run(
      `UPDATE products SET name = ?, brand = ?, model = ?, category = ?, sku = ?, barcode = ?, 
       imei_required = ?, serial_required = ?, color = ?, storage = ?, description = ?, 
       buy_price = ?, sell_price = ?, min_stock = ?, stock = ?, status = ?, 
       dollar_rate_at_purchase = ?, updated_at = ?
       WHERE id = ?`,
      [
        req.body.name, req.body.brand || '', req.body.model || '', req.body.category || '',
        req.body.sku || '', req.body.barcode || '', req.body.imeiRequired ? 1 : 0,
        req.body.serialRequired ? 1 : 0, req.body.color || '', req.body.storage || '',
        req.body.description || '', req.body.buyPrice || 0, req.body.sellPrice || 0,
        req.body.minStock || 0, req.body.stock || 0, req.body.status || 'active',
        req.body.dollarRateAtPurchase || null, now, req.params.id
      ]
    );

    saveDatabase();
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Products - Delete
app.delete('/api/products/:id', authenticateToken, checkPermission('products.delete'), (req, res) => {
  try {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Product Serials - Get
app.get('/api/products/:id/serials', authenticateToken, (req, res) => {
  try {
    const serials = queryAll('SELECT * FROM product_serials WHERE product_id = ?', [req.params.id]);
    res.json(serials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch serials' });
  }
});

// Product Serials - Create
app.post('/api/products/:id/serials', authenticateToken, checkPermission('products.edit'), (req, res) => {
  try {
    const id = uuidv4();
    
    db.run(
      `INSERT INTO product_serials (id, product_id, imei1, imei2, serial, status, purchase_id, sale_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.params.id, req.body.imei1 || '', req.body.imei2 || '',
        req.body.serial || '', req.body.status || 'available',
        req.body.purchaseId || null, req.body.saleId || null, new Date().toISOString()
      ]
    );

    saveDatabase();
    res.json({ id, message: 'Serial created successfully' });
  } catch (error) {
    console.error('Create serial error:', error);
    res.status(500).json({ error: 'Failed to create serial' });
  }
});

// Customers - Update
app.put('/api/customers/:id', authenticateToken, checkPermission('customers.edit'), (req, res) => {
  try {
    db.run(
      `UPDATE customers SET first_name = ?, last_name = ?, mobile = ?, national_id = ?, 
       address = ?, notes = ?, total_purchase = ?, total_paid = ?, debt = ?, 
       invoice_count = ?, last_purchase = ?
       WHERE id = ?`,
      [
        req.body.firstName, req.body.lastName || '', req.body.mobile || '',
        req.body.nationalId || '', req.body.address || '', req.body.notes || '',
        req.body.totalPurchase || 0, req.body.totalPaid || 0, req.body.debt || 0,
        req.body.invoiceCount || 0, req.body.lastPurchase || null, req.params.id
      ]
    );

    saveDatabase();
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Customers - Delete
app.delete('/api/customers/:id', authenticateToken, checkPermission('customers.edit'), (req, res) => {
  try {
    db.run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Sales - Create
app.post('/api/sales', authenticateToken, checkPermission('sales.create'), (req, res) => {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO sales (id, invoice_number, date, time, customer_id, customer_name, seller_id, seller_name,
       subtotal, discount, discount_type, tax, total, paid, remaining, payment_method, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.body.invoiceNumber, req.body.date, req.body.time,
        req.body.customerId, req.body.customerName, req.body.sellerId, req.body.sellerName,
        req.body.subtotal || 0, req.body.discount || 0, req.body.discountType || 'amount',
        req.body.tax || 0, req.body.total || 0, req.body.paid || 0, req.body.remaining || 0,
        req.body.paymentMethod || 'cash', req.body.status || 'completed', req.body.notes || '', now
      ]
    );

    // Insert sale items
    if (req.body.items && req.body.items.length > 0) {
      req.body.items.forEach(item => {
        const itemId = uuidv4();
        db.run(
          `INSERT INTO sale_items (id, sale_id, product_id, product_name, brand, model, barcode, 
           imei1, imei2, quantity, buy_price, sell_price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, id, item.productId, item.productName, item.brand || '', item.model || '',
            item.barcode || '', item.imei1 || '', item.imei2 || '', item.quantity || 1,
            item.buyPrice || 0, item.sellPrice || 0, item.discount || 0, item.total || 0
          ]
        );
      });
    }

    saveDatabase();
    res.json({ id, message: 'Sale created successfully' });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Sales - Update
app.put('/api/sales/:id', authenticateToken, checkPermission('sales.edit'), (req, res) => {
  try {
    db.run(
      `UPDATE sales SET subtotal = ?, discount = ?, discount_type = ?, tax = ?, total = ?, 
       paid = ?, remaining = ?, payment_method = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        req.body.subtotal || 0, req.body.discount || 0, req.body.discountType || 'amount',
        req.body.tax || 0, req.body.total || 0, req.body.paid || 0, req.body.remaining || 0,
        req.body.paymentMethod || 'cash', req.body.status || 'completed', req.body.notes || '',
        req.params.id
      ]
    );

    saveDatabase();
    res.json({ message: 'Sale updated successfully' });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

// Sales - Delete (Cancel)
app.delete('/api/sales/:id', authenticateToken, checkPermission('sales.cancel'), (req, res) => {
  try {
    // Update status to cancelled instead of deleting
    db.run('UPDATE sales SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    saveDatabase();
    res.json({ message: 'Sale cancelled successfully' });
  } catch (error) {
    console.error('Cancel sale error:', error);
    res.status(500).json({ error: 'Failed to cancel sale' });
  }
});

// Repairs Routes
app.get('/api/repairs', authenticateToken, (req, res) => {
  try {
    const repairs = queryAll('SELECT * FROM repairs ORDER BY created_at DESC');
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repairs' });
  }
});

app.post('/api/repairs', authenticateToken, checkPermission('repairs.create'), (req, res) => {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO repairs (id, ticket_number, customer_name, customer_mobile, device, brand, model,
       imei, serial, color, physical_condition, accessories, device_password, reported_issue, diagnosis,
       parts, labor, parts_cost, extra_cost, total_cost, paid, remaining, technician_id, technician_name,
       status, entry_date, delivery_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.body.ticketNumber, req.body.customerName, req.body.customerMobile || '',
        req.body.device, req.body.brand || '', req.body.model || '', req.body.imei || '',
        req.body.serial || '', req.body.color || '', req.body.physicalCondition || '',
        req.body.accessories || '', req.body.devicePassword || '', req.body.reportedIssue || '',
        req.body.diagnosis || '', JSON.stringify(req.body.parts || []), req.body.labor || 0,
        req.body.partsCost || 0, req.body.extraCost || 0, req.body.totalCost || 0,
        req.body.paid || 0, req.body.remaining || 0, req.body.technicianId || '',
        req.body.technicianName || '', req.body.status || 'received', req.body.entryDate || now,
        req.body.deliveryDate || null, req.body.notes || '', now
      ]
    );

    saveDatabase();
    res.json({ id, message: 'Repair created successfully' });
  } catch (error) {
    console.error('Create repair error:', error);
    res.status(500).json({ error: 'Failed to create repair' });
  }
});

app.put('/api/repairs/:id', authenticateToken, checkPermission('repairs.edit'), (req, res) => {
  try {
    db.run(
      `UPDATE repairs SET customer_name = ?, customer_mobile = ?, device = ?, brand = ?, model = ?,
       imei = ?, serial = ?, color = ?, physical_condition = ?, accessories = ?, device_password = ?,
       reported_issue = ?, diagnosis = ?, parts = ?, labor = ?, parts_cost = ?, extra_cost = ?,
       total_cost = ?, paid = ?, remaining = ?, technician_id = ?, technician_name = ?, status = ?,
       entry_date = ?, delivery_date = ?, notes = ?
       WHERE id = ?`,
      [
        req.body.customerName, req.body.customerMobile || '', req.body.device,
        req.body.brand || '', req.body.model || '', req.body.imei || '', req.body.serial || '',
        req.body.color || '', req.body.physicalCondition || '', req.body.accessories || '',
        req.body.devicePassword || '', req.body.reportedIssue || '', req.body.diagnosis || '',
        JSON.stringify(req.body.parts || []), req.body.labor || 0, req.body.partsCost || 0,
        req.body.extraCost || 0, req.body.totalCost || 0, req.body.paid || 0,
        req.body.remaining || 0, req.body.technicianId || '', req.body.technicianName || '',
        req.body.status || 'received', req.body.entryDate, req.body.deliveryDate || null,
        req.body.notes || '', req.params.id
      ]
    );

    saveDatabase();
    res.json({ message: 'Repair updated successfully' });
  } catch (error) {
    console.error('Update repair error:', error);
    res.status(500).json({ error: 'Failed to update repair' });
  }
});

// Stock Movements Routes
app.get('/api/stock-movements', authenticateToken, (req, res) => {
  try {
    const movements = queryAll('SELECT * FROM stock_movements ORDER BY date DESC');
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

app.post('/api/stock-movements', authenticateToken, checkPermission('inventory.adjust'), (req, res) => {
  try {
    const id = uuidv4();
    
    db.run(
      `INSERT INTO stock_movements (id, product_id, product_name, type, quantity, reference, 
       reference_type, reference_id, user_id, user_name, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.body.productId, req.body.productName, req.body.type, req.body.quantity,
        req.body.reference || '', req.body.referenceType || '', req.body.referenceId || '',
        req.body.userId || '', req.body.userName || '', new Date().toISOString(), req.body.notes || ''
      ]
    );

    saveDatabase();
    res.json({ id, message: 'Stock movement created successfully' });
  } catch (error) {
    console.error('Create stock movement error:', error);
    res.status(500).json({ error: 'Failed to create stock movement' });
  }
});

// Purchases Routes
app.get('/api/purchases', authenticateToken, (req, res) => {
  try {
    const purchases = queryAll('SELECT * FROM purchases ORDER BY created_at DESC');
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

app.post('/api/purchases', authenticateToken, checkPermission('purchases.create'), (req, res) => {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO purchases (id, invoice_number, date, supplier_id, supplier_name, subtotal, 
       total, paid, remaining, dollar_rate, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.body.invoiceNumber, req.body.date, req.body.supplierId || '',
        req.body.supplierName, req.body.subtotal || 0, req.body.total || 0,
        req.body.paid || 0, req.body.remaining || 0, req.body.dollarRate || 0,
        req.body.notes || '', now
      ]
    );

    // Insert purchase items
    if (req.body.items && req.body.items.length > 0) {
      req.body.items.forEach(item => {
        const itemId = uuidv4();
        db.run(
          `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, quantity, buy_price, total, imeis)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, id, item.productId, item.productName, item.quantity || 1,
            item.buyPrice || 0, item.total || 0, JSON.stringify(item.imeis || [])
          ]
        );
      });
    }

    saveDatabase();
    res.json({ id, message: 'Purchase created successfully' });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// Payments Routes
app.get('/api/payments', authenticateToken, (req, res) => {
  try {
    const payments = queryAll('SELECT * FROM payments ORDER BY date DESC');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/payments', authenticateToken, checkPermission('financial.expenses'), (req, res) => {
  try {
    const id = uuidv4();
    
    db.run(
      `INSERT INTO payments (id, customer_id, customer_name, type, amount, method, reference, 
       reference_type, reference_id, user_id, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.body.customerId || '', req.body.customerName, req.body.type,
        req.body.amount, req.body.method || 'cash', req.body.reference || '',
        req.body.referenceType || '', req.body.referenceId || '', req.body.userId || '',
        new Date().toISOString(), req.body.notes || ''
      ]
    );

    saveDatabase();
    res.json({ id, message: 'Payment created successfully' });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Audit Logs Routes
app.get('/api/audit-logs', authenticateToken, (req, res) => {
  try {
    const logs = queryAll('SELECT * FROM audit_logs ORDER BY date DESC LIMIT 100');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Migration Routes
app.post('/api/migration/import', authenticateToken, checkPermission('backup.restore'), (req, res) => {
  try {
    const data = req.body;
    let importedCount = 0;
    const errors = [];

    // Import Users
    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        try {
          const existing = queryOne('SELECT id FROM users WHERE username = ?', [user.username]);
          if (!existing) {
            db.run(
              `INSERT INTO users (id, username, password_hash, full_name, role, permissions, visible_pages, active, max_discount, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [user.id, user.username, user.passwordHash, user.fullName, user.role, 
               JSON.stringify(user.permissions), JSON.stringify(user.visiblePages), 
               user.active ? 1 : 0, user.maxDiscount || 0, user.createdAt]
            );
            importedCount++;
          }
        } catch (error) {
          errors.push(`User ${user.username}: ${error.message}`);
        }
      }
    }

    // Import Products
    if (data.products && data.products.length > 0) {
      for (const product of data.products) {
        try {
          db.run(
            `INSERT OR REPLACE INTO products (id, name, brand, model, category, sku, barcode, 
             imei_required, serial_required, color, storage, description, buy_price, sell_price, 
             min_stock, stock, status, dollar_rate_at_purchase, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [product.id, product.name, product.brand || '', product.model || '', product.category || '',
             product.sku || '', product.barcode || '', product.imeiRequired ? 1 : 0, 
             product.serialRequired ? 1 : 0, product.color || '', product.storage || '',
             product.description || '', product.buyPrice || 0, product.sellPrice || 0,
             product.minStock || 0, product.stock || 0, product.status || 'active',
             product.dollarRateAtPurchase || null, product.createdAt, product.updatedAt]
          );
          importedCount++;
        } catch (error) {
          errors.push(`Product ${product.name}: ${error.message}`);
        }
      }
    }

    // Import Customers
    if (data.customers && data.customers.length > 0) {
      for (const customer of data.customers) {
        try {
          db.run(
            `INSERT OR REPLACE INTO customers (id, first_name, last_name, mobile, national_id, 
             address, notes, total_purchase, total_paid, debt, invoice_count, last_purchase, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer.id, customer.firstName, customer.lastName || '', customer.mobile || '',
             customer.nationalId || '', customer.address || '', customer.notes || '',
             customer.totalPurchase || 0, customer.totalPaid || 0, customer.debt || 0,
             customer.invoiceCount || 0, customer.lastPurchase || null, customer.createdAt]
          );
          importedCount++;
        } catch (error) {
          errors.push(`Customer ${customer.firstName}: ${error.message}`);
        }
      }
    }

    saveDatabase();

    res.json({
      success: errors.length === 0,
      message: errors.length === 0 ? 'Import completed successfully' : `Import completed with ${errors.length} errors`,
      importedCount,
      errors,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

app.get('/api/migration/export', authenticateToken, checkPermission('backup.create'), (req, res) => {
  try {
    const data = {
      users: queryAll('SELECT * FROM users'),
      products: queryAll('SELECT * FROM products'),
      productSerials: queryAll('SELECT * FROM product_serials'),
      customers: queryAll('SELECT * FROM customers'),
      sales: queryAll('SELECT * FROM sales'),
      saleItems: queryAll('SELECT * FROM sale_items'),
      repairs: queryAll('SELECT * FROM repairs'),
      purchases: queryAll('SELECT * FROM purchases'),
      purchaseItems: queryAll('SELECT * FROM purchase_items'),
      payments: queryAll('SELECT * FROM payments'),
      stockMovements: queryAll('SELECT * FROM stock_movements'),
      auditLogs: queryAll('SELECT * FROM audit_logs'),
      exportDate: new Date().toISOString(),
      version: '2.0.0',
    };

    res.json(data);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Serve React App (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Helper function to get local IPs
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// Start Server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log(`
╔══════════════════════════════════════════════════════╗
║        ID Mobile Manager Pro - Unified Server       ║
╠══════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                        ║
║                                                      ║
║  Access from this computer:                          ║
║    → http://localhost:${PORT}                          ║
║                                                      ║
║  Access from mobile/tablet on same WiFi:             ║`);
    ips.forEach(ip => {
      console.log(`║    → http://${ip}:${PORT}${' '.repeat(Math.max(0, 35 - ip.length))}║`);
    });
    console.log(`║                                                      ║
║  Default login: admin / admin123                     ║
║  (Change password on first login)                    ║
║                                                      ║
║  Database: SQLite (data/idmobile.db)                ║
║  API: http://localhost:${PORT}/api                     ║
║                                                      ║
║  Press Ctrl+C to stop the server                     ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

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

// Sales Routes
app.get('/api/sales', authenticateToken, (req, res) => {
  try {
    const sales = queryAll('SELECT * FROM sales ORDER BY created_at DESC');
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
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

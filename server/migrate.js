/**
 * ID Mobile Manager Pro - Data Migration Script
 * Migrates data from localStorage to SQLite database
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'idmobile.db');
const db = new Database(dbPath);

console.log('🔄 Starting data migration from localStorage to SQLite...\n');

// This script should be run in a browser environment to access localStorage
// For now, we'll create a template that can be executed in browser console

const migrationScript = `
// Run this in browser console while on the app

function migrateData() {
  console.log('🔄 Starting migration...');
  
  const data = {
    users: JSON.parse(localStorage.getItem('idmobile_users') || '[]'),
    products: JSON.parse(localStorage.getItem('idmobile_products') || '[]'),
    customers: JSON.parse(localStorage.getItem('idmobile_customers') || '[]'),
    sales: JSON.parse(localStorage.getItem('idmobile_sales') || '[]'),
    purchases: JSON.parse(localStorage.getItem('idmobile_purchases') || '[]'),
    repairs: JSON.parse(localStorage.getItem('idmobile_repairs') || '[]'),
    settings: JSON.parse(localStorage.getItem('idmobile_settings') || '{}'),
  };
  
  console.log('📊 Data to migrate:');
  console.log('  Users:', data.users.length);
  console.log('  Products:', data.products.length);
  console.log('  Customers:', data.customers.length);
  console.log('  Sales:', data.sales.length);
  console.log('  Purchases:', data.purchases.length);
  console.log('  Repairs:', data.repairs.length);
  
  // Export as JSON
  const exportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    data: data
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'idmobile_migration_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Migration data exported!');
  console.log('📁 File downloaded. Now run: node server/import-data.js');
}

migrateData();
`;

console.log('📝 Browser Migration Script:');
console.log('─'.repeat(50));
console.log(migrationScript);
console.log('─'.repeat(50));

console.log('\n📋 Instructions:');
console.log('1. Open the app in browser');
console.log('2. Open DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste the script above');
console.log('5. Press Enter to run');
console.log('6. Download the JSON file');
console.log('7. Run: node server/import-data.js');

// Import script template
const importScript = `
/**
 * Import data from JSON file to SQLite database
 * Usage: node server/import-data.js <json-file>
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const jsonFile = process.argv[2];

if (!jsonFile) {
  console.error('❌ Usage: node server/import-data.js <json-file>');
  process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
  console.error('❌ File not found:', jsonFile);
  process.exit(1);
}

const dbPath = path.join(__dirname, 'data', 'idmobile.db');
const db = new Database(dbPath);

console.log('📂 Reading file:', jsonFile);
const fileContent = fs.readFileSync(jsonFile, 'utf8');
const exportData = JSON.parse(fileContent);

console.log('📊 Importing data...');

// Import users
if (exportData.data.users && exportData.data.users.length > 0) {
  console.log('  Importing', exportData.data.users.length, 'users...');
  const insertUser = db.prepare(\`
    INSERT OR REPLACE INTO users (id, username, password_hash, full_name, role, permissions, visible_pages, active, last_login, max_discount, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`);
  
  for (const user of exportData.data.users) {
    insertUser.run(
      user.id,
      user.username,
      user.passwordHash,
      user.fullName,
      user.role,
      JSON.stringify(user.permissions),
      JSON.stringify(user.visiblePages),
      user.active ? 1 : 0,
      user.lastLogin || null,
      user.maxDiscount || 0,
      user.avatar || null,
      user.createdAt
    );
  }
}

// Import products
if (exportData.data.products && exportData.data.products.length > 0) {
  console.log('  Importing', exportData.data.products.length, 'products...');
  const insertProduct = db.prepare(\`
    INSERT OR REPLACE INTO products (id, name, brand, model, category, sku, barcode, imei_required, serial_required, color, storage, description, buy_price, sell_price, min_stock, stock, status, dollar_rate_at_purchase, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`);
  
  for (const product of exportData.data.products) {
    insertProduct.run(
      product.id,
      product.name,
      product.brand || '',
      product.model || '',
      product.category || '',
      product.sku || '',
      product.barcode || '',
      product.imeiRequired ? 1 : 0,
      product.serialRequired ? 1 : 0,
      product.color || '',
      product.storage || '',
      product.description || '',
      product.buyPrice || 0,
      product.sellPrice || 0,
      product.minStock || 0,
      product.stock || 0,
      product.status || 'active',
      product.dollarRateAtPurchase || null,
      product.createdAt,
      product.updatedAt
    );
  }
}

// Import customers
if (exportData.data.customers && exportData.data.customers.length > 0) {
  console.log('  Importing', exportData.data.customers.length, 'customers...');
  const insertCustomer = db.prepare(\`
    INSERT OR REPLACE INTO customers (id, first_name, last_name, mobile, national_id, address, notes, total_purchase, total_paid, debt, invoice_count, last_purchase, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`);
  
  for (const customer of exportData.data.customers) {
    insertCustomer.run(
      customer.id,
      customer.firstName,
      customer.lastName || '',
      customer.mobile || '',
      customer.nationalId || '',
      customer.address || '',
      customer.notes || '',
      customer.totalPurchase || 0,
      customer.totalPaid || 0,
      customer.debt || 0,
      customer.invoiceCount || 0,
      customer.lastPurchase || null,
      customer.createdAt
    );
  }
}

console.log('✅ Import completed successfully!');
`;

// Save import script
const importScriptPath = path.join(__dirname, 'import-data.js');
fs.writeFileSync(importScriptPath, importScript);

console.log('\n✅ Import script created:', importScriptPath);
console.log('\n📚 Next steps:');
console.log('1. Install backend dependencies: npm install express cors bcrypt jsonwebtoken better-sqlite3 uuid');
console.log('2. Start backend: node server/backend.js');
console.log('3. Run migration in browser');
console.log('4. Import data: node server/import-data.js <json-file>');

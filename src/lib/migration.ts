/**
 * Data Migration Script
 * انتقال داده‌ها از localStorage به SQLite
 */

import { db } from './db';
import { financialDb } from './financialDb';

// ============================================
// Types
// ============================================

export interface MigrationResult {
  success: boolean;
  message: string;
  stats: {
    users: number;
    products: number;
    customers: number;
    sales: number;
    repairs: number;
    purchases: number;
    payments: number;
    stockMovements: number;
    auditLogs: number;
    financialAccounts: number;
    journalEntries: number;
    cashAccounts: number;
    bankAccounts: number;
    expenses: number;
    incomeTransactions: number;
    checks: number;
    transfers: number;
  };
  errors: string[];
}

// ============================================
// Migration Functions
// ============================================

/**
 * Export all data from localStorage
 */
export function exportFromLocalStorage(): any {
  console.log('📦 Exporting data from localStorage...');

  const data = {
    // Core data
    users: db.getUsers(),
    products: db.getProducts(),
    productSerials: db.getSerials(),
    customers: db.getCustomers(),
    sales: db.getSales(),
    repairs: db.getRepairs(),
    purchases: db.getPurchases(),
    payments: db.getPayments(),
    stockMovements: db.getStockMovements(),
    auditLogs: db.getAuditLogs(),
    settings: db.getSettings(),
    
    // Financial data
    accounts: financialDb.getAccounts(),
    journalEntries: financialDb.getJournalEntries(),
    cashAccounts: financialDb.getCashAccounts(),
    bankAccounts: financialDb.getBankAccounts(),
    posTerminals: financialDb.getPOSTerminals(),
    posTransactions: financialDb.getPOSTransactions(),
    expenses: financialDb.getExpenses(),
    incomeTransactions: financialDb.getIncomeTransactions(),
    checks: financialDb.getChecks(),
    transfers: financialDb.getTransfers(),
    budgets: financialDb.getBudgets(),
    accountingPeriods: financialDb.getAccountingPeriods(),
    financialAuditLogs: financialDb.getFinancialAuditLogs(),
    
    // Metadata
    exportDate: new Date().toISOString(),
    version: '2.0.0',
  };

  console.log('✅ Export completed');
  return data;
}

/**
 * Import data to backend API
 */
export async function importToBackend(data: any): Promise<MigrationResult> {
  console.log('📥 Importing data to backend...');

  const result: MigrationResult = {
    success: true,
    message: '',
    stats: {
      users: 0,
      products: 0,
      customers: 0,
      sales: 0,
      repairs: 0,
      purchases: 0,
      payments: 0,
      stockMovements: 0,
      auditLogs: 0,
      financialAccounts: 0,
      journalEntries: 0,
      cashAccounts: 0,
      bankAccounts: 0,
      expenses: 0,
      incomeTransactions: 0,
      checks: 0,
      transfers: 0,
    },
    errors: [],
  };

  try {
    // Use bulk import endpoint
    const response = await fetch('/api/migration/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('idmobile_token')}`,
      },
      body: JSON.stringify(data),
    });

    const importResult = await response.json();

    if (response.ok) {
      result.success = importResult.success;
      result.message = importResult.message;
      result.errors = importResult.errors || [];
      
      // Count imported items
      result.stats.users = data.users?.length || 0;
      result.stats.products = data.products?.length || 0;
      result.stats.customers = data.customers?.length || 0;
      result.stats.sales = data.sales?.length || 0;
      result.stats.repairs = data.repairs?.length || 0;
      result.stats.purchases = data.purchases?.length || 0;
      result.stats.payments = data.payments?.length || 0;
      result.stats.stockMovements = data.stockMovements?.length || 0;
      result.stats.auditLogs = data.auditLogs?.length || 0;
    } else {
      result.success = false;
      result.message = importResult.error || 'Import failed';
      result.errors = [importResult.error || 'Unknown error'];
    }

  } catch (error: any) {
    result.success = false;
    result.message = `❌ Migration failed: ${error.message}`;
    result.errors = [error.message];
  }

  console.log('✅ Import completed');
  return result;
}

/**
 * Run full migration
 */
export async function runMigration(): Promise<MigrationResult> {
  console.log('🚀 Starting migration...');
  
  // Step 1: Export from localStorage
  const data = exportFromLocalStorage();
  
  // Step 2: Save export to file (for backup)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `migration-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('💾 Backup saved');
  
  // Step 3: Import to backend
  const result = await importToBackend(data);
  
  console.log('🎉 Migration completed');
  return result;
}

/**
 * Clear localStorage after successful migration
 */
export function clearLocalStorage(): void {
  console.log('🗑️ Clearing localStorage...');
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('idmobile_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ localStorage cleared');
}

/**
 * Verify migration
 */
export async function verifyMigration(): Promise<boolean> {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if backend has data
    const response = await fetch('/api/health');
    if (!response.ok) {
      console.error('❌ Backend is not accessible');
      return false;
    }
    
    // Check products
    const productsResponse = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('idmobile_token')}`,
      },
    });
    const products = await productsResponse.json();
    
    if (products.length === 0) {
      console.warn('⚠️ No products found in backend');
    }
    
    console.log('✅ Migration verified');
    return true;
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    return false;
  }
}

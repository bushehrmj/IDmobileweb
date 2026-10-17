/**
 * API Testing Script
 * تست تمام API endpoints
 */

import { 
  authApi, 
  productsApi, 
  customersApi, 
  salesApi, 
  repairsApi, 
  purchasesApi, 
  inventoryApi, 
  paymentsApi, 
  auditApi,
  healthApi,
  getToken,
  setToken,
  removeToken
} from './api';

// ============================================
// Test Helper
// ============================================

async function testApi(name: string, fn: () => Promise<any>) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    const result = await fn();
    if (result.error) {
      console.log(`❌ Failed: ${result.error}`);
      return false;
    }
    console.log(`✅ Success:`, result.data || result.message);
    return true;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

// ============================================
// Test Suite
// ============================================

export async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log('='.repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Test 1: Health Check
  results.total++;
  if (await testApi('Health Check', () => healthApi.check())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: Login
  results.total++;
  const loginResult = await testApi('Login', () => authApi.login('admin', 'admin123'));
  if (loginResult) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Check if token exists
  const token = getToken();
  if (!token) {
    console.log('\n❌ No token received. Cannot continue tests.');
    return results;
  }

  // Test 3: Get Current User
  results.total++;
  if (await testApi('Get Current User', () => authApi.me())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Get Products
  results.total++;
  if (await testApi('Get Products', () => productsApi.getAll())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Create Product
  results.total++;
  const testProduct = {
    id: 'test-product-' + Date.now(),
    name: 'Test Product',
    brand: 'Test Brand',
    model: 'Test Model',
    category: 'موبایل',
    buyPrice: 1000000,
    sellPrice: 1200000,
    stock: 10,
    minStock: 2,
    status: 'active',
  };

  if (await testApi('Create Product', () => productsApi.create(testProduct))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: Get Product by ID
  results.total++;
  if (await testApi('Get Product by ID', () => productsApi.getById(testProduct.id))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 7: Update Product
  results.total++;
  if (await testApi('Update Product', () => productsApi.update(testProduct.id, { ...testProduct, stock: 15 }))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 8: Get Customers
  results.total++;
  if (await testApi('Get Customers', () => customersApi.getAll())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 9: Create Customer
  results.total++;
  const testCustomer = {
    id: 'test-customer-' + Date.now(),
    firstName: 'Test',
    lastName: 'Customer',
    mobile: '09121234567',
    nationalId: '1234567890',
    address: 'Test Address',
    notes: 'Test Notes',
  };

  if (await testApi('Create Customer', () => customersApi.create(testCustomer))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 10: Get Sales
  results.total++;
  if (await testApi('Get Sales', () => salesApi.getAll())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 11: Create Sale
  results.total++;
  const testSale = {
    id: 'test-sale-' + Date.now(),
    invoiceNumber: 'TEST-' + Date.now(),
    date: new Date().toISOString(),
    time: new Date().toLocaleTimeString('fa-IR'),
    customerId: testCustomer.id,
    customerName: 'Test Customer',
    sellerId: 'admin',
    sellerName: 'Admin',
    items: [
      {
        productId: testProduct.id,
        productName: testProduct.name,
        quantity: 1,
        sellPrice: testProduct.sellPrice,
        total: testProduct.sellPrice,
      },
    ],
    subtotal: testProduct.sellPrice,
    discount: 0,
    tax: 0,
    total: testProduct.sellPrice,
    paid: testProduct.sellPrice,
    remaining: 0,
    paymentMethod: 'cash',
    status: 'completed',
  };

  if (await testApi('Create Sale', () => salesApi.create(testSale))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 12: Get Repairs
  results.total++;
  if (await testApi('Get Repairs', () => repairsApi.getAll())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 13: Create Repair
  results.total++;
  const testRepair = {
    id: 'test-repair-' + Date.now(),
    ticketNumber: 'REP-' + Date.now(),
    customerName: 'Test Customer',
    customerMobile: '09121234567',
    device: 'iPhone',
    brand: 'Apple',
    model: '13',
    imei: '123456789012345',
    reportedIssue: 'Test issue',
    status: 'received',
    entryDate: new Date().toISOString().split('T')[0],
    technicianName: 'Admin',
  };

  if (await testApi('Create Repair', () => repairsApi.create(testRepair))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 14: Get Purchases
  results.total++;
  if (await testApi('Get Purchases', () => purchasesApi.getAll())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 15: Get Stock Movements
  results.total++;
  if (await testApi('Get Stock Movements', () => inventoryApi.getMovements())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 16: Get Payments
  results.total++;
  if (await testApi('Get Payments', () => paymentsApi.getAll())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 17: Get Audit Logs
  results.total++;
  if (await testApi('Get Audit Logs', () => auditApi.getLogs())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 18: Delete Product
  results.total++;
  if (await testApi('Delete Product', () => productsApi.delete(testProduct.id))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 19: Delete Customer
  results.total++;
  if (await testApi('Delete Customer', () => customersApi.delete(testCustomer.id))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 20: Cancel Sale
  results.total++;
  if (await testApi('Cancel Sale', () => salesApi.cancel(testSale.id))) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 21: Logout
  results.total++;
  if (await testApi('Logout', () => authApi.logout())) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Final Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total: ${results.total}`);
  console.log('='.repeat(50));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️ ${results.failed} test(s) failed.`);
  }

  return results;
}

// ============================================
// Run Tests in Browser Console
// ============================================

// To run tests, open browser console and type:
// import('./lib/api-test').then(m => m.runAllTests())

console.log('📝 API Test Script Loaded');
console.log('To run tests, execute: runAllTests()');

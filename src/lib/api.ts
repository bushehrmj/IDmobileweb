/**
 * API Client - Complete Backend Integration
 * Full API client with error handling, retry, and fallback
 */

import { db } from './db';

// Configuration
const API_BASE = '/api';
const USE_BACKEND = true; // ✅ Backend is active
const TIMEOUT = 10000; // 10 seconds timeout
const MAX_RETRIES = 3;

// ============================================
// Types
// ============================================

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// ============================================
// Token Management
// ============================================

export function getToken(): string | null {
  return sessionStorage.getItem('idmobile_token');
}

export function setToken(token: string): void {
  sessionStorage.setItem('idmobile_token', token);
}

export function removeToken(): void {
  sessionStorage.removeItem('idmobile_token');
}

// ============================================
// API Request Helper with Error Handling
// ============================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 0
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // Handle 401 Unauthorized - Token expired
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      return { error: 'Session expired. Please login again.', status: 401 };
    }

    // Handle 403 Forbidden - No permission
    if (response.status === 403) {
      return { error: 'شما دسترسی به این عملیات را ندارید', status: 403 };
    }

    // Handle other errors
    if (!response.ok) {
      // Retry on server errors (5xx)
      if (response.status >= 500 && retries < MAX_RETRIES) {
        console.log(`Retrying request (${retries + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return apiRequest(endpoint, options, retries + 1);
      }

      return { 
        error: data.error || data.message || 'خطا در درخواست', 
        status: response.status 
      };
    }

    return { data, status: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === 'AbortError') {
      return { error: 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.', status: 408 };
    }

    // Handle network error
    if (error.message === 'Failed to fetch') {
      // Fallback to localStorage if backend is unavailable
      console.warn('Backend unavailable, falling back to localStorage');
      return { error: 'BACKEND_UNAVAILABLE', status: 0 };
    }

    // Retry on network errors
    if (retries < MAX_RETRIES) {
      console.log(`Network error, retrying (${retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
      return apiRequest(endpoint, options, retries + 1);
    }

    return { error: 'خطا در اتصال به سرور', status: 0 };
  }
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  async login(username: string, password: string) {
    if (!USE_BACKEND) {
      return null;
    }
    
    const response = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.data?.token) {
      setToken(response.data.token);
    }

    return response;
  },

  async logout() {
    if (!USE_BACKEND) return null;
    
    const response = await apiRequest('/auth/logout', { method: 'POST' });
    removeToken();
    return response;
  },

  async me() {
    if (!USE_BACKEND) return null;
    return apiRequest('/auth/me');
  },

  async changePassword(oldPassword: string, newPassword: string) {
    if (!USE_BACKEND) return null;
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },
};

// ============================================
// Products API
// ============================================

export const productsApi = {
  async getAll() {
    if (!USE_BACKEND) {
      return { data: db.getProducts() };
    }
    
    const response = await apiRequest('/products');
    
    // Fallback to localStorage if backend unavailable
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getProducts() };
    }
    
    return response;
  },

  async getById(id: string) {
    if (!USE_BACKEND) {
      return { data: db.getProduct(id) };
    }
    
    const response = await apiRequest(`/products/${id}`);
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getProduct(id) };
    }
    
    return response;
  },

  async create(product: any) {
    if (!USE_BACKEND) {
      db.saveProduct(product);
      return { data: { id: product.id } };
    }
    
    const response = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveProduct(product);
      return { data: { id: product.id } };
    }
    
    return response;
  },

  async update(id: string, product: any) {
    if (!USE_BACKEND) {
      db.saveProduct({ ...product, id });
      return { data: { id } };
    }
    
    const response = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveProduct({ ...product, id });
      return { data: { id } };
    }
    
    return response;
  },

  async delete(id: string) {
    if (!USE_BACKEND) {
      db.deleteProduct(id);
      return { data: { id } };
    }
    
    const response = await apiRequest(`/products/${id}`, { method: 'DELETE' });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.deleteProduct(id);
      return { data: { id } };
    }
    
    return response;
  },

  async getSerials(productId: string) {
    if (!USE_BACKEND) {
      return { data: db.getSerialsByProduct(productId) };
    }
    
    const response = await apiRequest(`/products/${productId}/serials`);
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getSerialsByProduct(productId) };
    }
    
    return response;
  },

  async createSerial(productId: string, serial: any) {
    if (!USE_BACKEND) {
      db.saveSerial({ ...serial, productId });
      return { data: { id: serial.id } };
    }
    
    const response = await apiRequest(`/products/${productId}/serials`, {
      method: 'POST',
      body: JSON.stringify(serial),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveSerial({ ...serial, productId });
      return { data: { id: serial.id } };
    }
    
    return response;
  },
};

// ============================================
// Customers API
// ============================================

export const customersApi = {
  async getAll() {
    if (!USE_BACKEND) {
      return { data: db.getCustomers() };
    }
    
    const response = await apiRequest('/customers');
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getCustomers() };
    }
    
    return response;
  },

  async getById(id: string) {
    if (!USE_BACKEND) {
      return { data: db.getCustomer(id) };
    }
    
    const response = await apiRequest(`/customers/${id}`);
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getCustomer(id) };
    }
    
    return response;
  },

  async create(customer: any) {
    if (!USE_BACKEND) {
      db.saveCustomer(customer);
      return { data: { id: customer.id } };
    }
    
    const response = await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveCustomer(customer);
      return { data: { id: customer.id } };
    }
    
    return response;
  },

  async update(id: string, customer: any) {
    if (!USE_BACKEND) {
      db.saveCustomer({ ...customer, id });
      return { data: { id } };
    }
    
    const response = await apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveCustomer({ ...customer, id });
      return { data: { id } };
    }
    
    return response;
  },

  async delete(id: string) {
    if (!USE_BACKEND) {
      db.deleteCustomer(id);
      return { data: { id } };
    }
    
    const response = await apiRequest(`/customers/${id}`, { method: 'DELETE' });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.deleteCustomer(id);
      return { data: { id } };
    }
    
    return response;
  },
};

// ============================================
// Sales API
// ============================================

export const salesApi = {
  async getAll() {
    if (!USE_BACKEND) {
      return { data: db.getSales() };
    }
    
    const response = await apiRequest('/sales');
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getSales() };
    }
    
    return response;
  },

  async getById(id: string) {
    if (!USE_BACKEND) {
      return { data: db.getSale(id) };
    }
    
    const response = await apiRequest(`/sales/${id}`);
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getSale(id) };
    }
    
    return response;
  },

  async create(sale: any) {
    if (!USE_BACKEND) {
      db.saveSale(sale);
      return { data: { id: sale.id } };
    }
    
    const response = await apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveSale(sale);
      return { data: { id: sale.id } };
    }
    
    return response;
  },

  async update(id: string, sale: any) {
    if (!USE_BACKEND) {
      db.saveSale({ ...sale, id });
      return { data: { id } };
    }
    
    const response = await apiRequest(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveSale({ ...sale, id });
      return { data: { id } };
    }
    
    return response;
  },

  async cancel(id: string) {
    if (!USE_BACKEND) {
      const sale = db.getSale(id);
      if (sale) {
        sale.status = 'cancelled';
        db.saveSale(sale);
      }
      return { data: { id } };
    }
    
    const response = await apiRequest(`/sales/${id}`, { method: 'DELETE' });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      const sale = db.getSale(id);
      if (sale) {
        sale.status = 'cancelled';
        db.saveSale(sale);
      }
      return { data: { id } };
    }
    
    return response;
  },
};

// ============================================
// Repairs API
// ============================================

export const repairsApi = {
  async getAll() {
    if (!USE_BACKEND) {
      return { data: db.getRepairs() };
    }
    
    const response = await apiRequest('/repairs');
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getRepairs() };
    }
    
    return response;
  },

  async create(repair: any) {
    if (!USE_BACKEND) {
      db.saveRepair(repair);
      return { data: { id: repair.id } };
    }
    
    const response = await apiRequest('/repairs', {
      method: 'POST',
      body: JSON.stringify(repair),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveRepair(repair);
      return { data: { id: repair.id } };
    }
    
    return response;
  },

  async update(id: string, repair: any) {
    if (!USE_BACKEND) {
      db.saveRepair({ ...repair, id });
      return { data: { id } };
    }
    
    const response = await apiRequest(`/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(repair),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveRepair({ ...repair, id });
      return { data: { id } };
    }
    
    return response;
  },
};

// ============================================
// Purchases API
// ============================================

export const purchasesApi = {
  async getAll() {
    if (!USE_BACKEND) {
      return { data: db.getPurchases() };
    }
    
    const response = await apiRequest('/purchases');
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getPurchases() };
    }
    
    return response;
  },

  async create(purchase: any) {
    if (!USE_BACKEND) {
      db.savePurchase(purchase);
      return { data: { id: purchase.id } };
    }
    
    const response = await apiRequest('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.savePurchase(purchase);
      return { data: { id: purchase.id } };
    }
    
    return response;
  },
};

// ============================================
// Inventory API
// ============================================

export const inventoryApi = {
  async getMovements() {
    if (!USE_BACKEND) {
      return { data: db.getStockMovements() };
    }
    
    const response = await apiRequest('/stock-movements');
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getStockMovements() };
    }
    
    return response;
  },

  async createMovement(movement: any) {
    if (!USE_BACKEND) {
      db.saveStockMovement(movement);
      return { data: { id: movement.id } };
    }
    
    const response = await apiRequest('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.saveStockMovement(movement);
      return { data: { id: movement.id } };
    }
    
    return response;
  },
};

// ============================================
// Payments API
// ============================================

export const paymentsApi = {
  async getAll() {
    if (!USE_BACKEND) {
      return { data: db.getPayments() };
    }
    
    const response = await apiRequest('/payments');
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getPayments() };
    }
    
    return response;
  },

  async create(payment: any) {
    if (!USE_BACKEND) {
      db.savePayment(payment);
      return { data: { id: payment.id } };
    }
    
    const response = await apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      db.savePayment(payment);
      return { data: { id: payment.id } };
    }
    
    return response;
  },
};

// ============================================
// Audit Logs API
// ============================================

export const auditApi = {
  async getLogs() {
    if (!USE_BACKEND) {
      return { data: db.getAuditLogs() };
    }
    
    const response = await apiRequest('/audit-logs');
    
    if (response.error === 'BACKEND_UNAVAILABLE') {
      return { data: db.getAuditLogs() };
    }
    
    return response;
  },
};

// ============================================
// Global Search API
// ============================================

export const searchApi = {
  async global(query: string, permissions: string[]) {
    // For now, use localStorage for search
    // In future, can be moved to backend
    const results: Array<{
      type: string;
      label: string;
      sublabel?: string;
      id: string;
      page: string;
    }> = [];

    const q = query.toLowerCase();

    // Search Products
    if (permissions.includes('products.view')) {
      const products = db.getProducts().filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q)
      );
      products.slice(0, 5).forEach(p => {
        results.push({
          type: 'کالا',
          label: p.name,
          sublabel: `${p.brand} ${p.model}`.trim(),
          id: p.id,
          page: 'products',
        });
      });
    }

    // Search Customers
    if (permissions.includes('customers.view')) {
      const customers = db.getCustomers().filter(
        c =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.mobile?.includes(q)
      );
      customers.slice(0, 5).forEach(c => {
        results.push({
          type: 'مشتری',
          label: `${c.firstName} ${c.lastName}`,
          sublabel: c.mobile,
          id: c.id,
          page: 'customers',
        });
      });
    }

    // Search Repairs
    if (permissions.includes('repairs.view')) {
      const repairs = db.getRepairs().filter(
        r =>
          r.ticketNumber.includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.imei?.includes(q) ||
          r.device?.toLowerCase().includes(q)
      );
      repairs.slice(0, 5).forEach(r => {
        results.push({
          type: 'تعمیر',
          label: `#${r.ticketNumber}`,
          sublabel: `${r.customerName} - ${r.device}`,
          id: r.id,
          page: 'repairs',
        });
      });
    }

    // Search Sales
    if (permissions.includes('sales.view')) {
      const sales = db.getSales().filter(
        s =>
          s.invoiceNumber.includes(q) ||
          s.customerName.toLowerCase().includes(q)
      );
      sales.slice(0, 5).forEach(s => {
        results.push({
          type: 'فاکتور',
          label: `#${s.invoiceNumber}`,
          sublabel: s.customerName,
          id: s.id,
          page: 'sales',
        });
      });
    }

    return { data: results };
  },
};

// ============================================
// Health Check API
// ============================================

export const healthApi = {
  async check() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Backend unavailable', status: 0 };
    }
  },
};

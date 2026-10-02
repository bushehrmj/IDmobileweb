/**
 * API Client - Hybrid approach
 * Works with both Backend API and localStorage fallback
 * 
 * Currently using localStorage as primary storage.
 * When backend is ready, set USE_BACKEND = true
 */

import { db } from './db';

// Use relative path for API - works with both localhost and LAN
const API_BASE = '/api';
const USE_BACKEND = false; // Set to true when backend is fully implemented

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Get auth token
function getToken(): string | null {
  return sessionStorage.getItem('idmobile_token');
}

// API Request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error' };
  }
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  async login(username: string, password: string) {
    if (!USE_BACKEND) {
      // Fallback to localStorage
      return null;
    }
    return apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async logout() {
    if (!USE_BACKEND) return null;
    return apiRequest('/auth/logout', { method: 'POST' });
  },

  async me() {
    if (!USE_BACKEND) return null;
    return apiRequest('/auth/me');
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
    return apiRequest('/products');
  },

  async getById(id: string) {
    if (!USE_BACKEND) {
      return { data: db.getProduct(id) };
    }
    return apiRequest(`/products/${id}`);
  },

  async create(product: any) {
    if (!USE_BACKEND) {
      db.saveProduct(product);
      return { data: { id: product.id } };
    }
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async update(id: string, product: any) {
    if (!USE_BACKEND) {
      db.saveProduct({ ...product, id });
      return { data: { id } };
    }
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async delete(id: string) {
    if (!USE_BACKEND) {
      db.deleteProduct(id);
      return { data: { id } };
    }
    return apiRequest(`/products/${id}`, { method: 'DELETE' });
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
    return apiRequest('/customers');
  },

  async getById(id: string) {
    if (!USE_BACKEND) {
      return { data: db.getCustomer(id) };
    }
    return apiRequest(`/customers/${id}`);
  },

  async create(customer: any) {
    if (!USE_BACKEND) {
      db.saveCustomer(customer);
      return { data: { id: customer.id } };
    }
    return apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  async update(id: string, customer: any) {
    if (!USE_BACKEND) {
      db.saveCustomer({ ...customer, id });
      return { data: { id } };
    }
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
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
    return apiRequest('/sales');
  },

  async getById(id: string) {
    if (!USE_BACKEND) {
      return { data: db.getSale(id) };
    }
    return apiRequest(`/sales/${id}`);
  },

  async create(sale: any) {
    if (!USE_BACKEND) {
      db.saveSale(sale);
      return { data: { id: sale.id } };
    }
    return apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
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
    return apiRequest('/repairs');
  },

  async create(repair: any) {
    if (!USE_BACKEND) {
      db.saveRepair(repair);
      return { data: { id: repair.id } };
    }
    return apiRequest('/repairs', {
      method: 'POST',
      body: JSON.stringify(repair),
    });
  },

  async update(id: string, repair: any) {
    if (!USE_BACKEND) {
      db.saveRepair({ ...repair, id });
      return { data: { id } };
    }
    return apiRequest(`/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(repair),
    });
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
    return apiRequest('/purchases');
  },

  async create(purchase: any) {
    if (!USE_BACKEND) {
      db.savePurchase(purchase);
      return { data: { id: purchase.id } };
    }
    return apiRequest('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  },
};

// ============================================
// Global Search API
// ============================================

export const searchApi = {
  async global(query: string, permissions: string[]) {
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

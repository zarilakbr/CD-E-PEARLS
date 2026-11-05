import axios from 'axios';
import { queryClient } from './queryClient';

// Cross-tab synchronization channel for authentication events
export const authChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('cde_auth_channel')
  : null;

// In browser development, requests to /api or /sanctum proxy to Laravel backend
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://api.cdepearlslombok.id/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Attach Bearer token fallback if present in storage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cde_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Interceptor for handling auth errors & rate limits
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on protected route, clean stored token & notify
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/logout')) {
        localStorage.removeItem('cde_auth_token');
        localStorage.removeItem('cde_user_role');
        queryClient.cancelQueries();
        queryClient.clear();
        authChannel?.postMessage({ type: 'SESSION_EXPIRED' });
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Initialize CSRF cookie for Sanctum SPA
 */
export async function getCsrfCookie(): Promise<void> {
  try {
    const sanctumUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/sanctum/csrf-cookie';
    await axios.get(sanctumUrl, { withCredentials: true });
  } catch (err) {
    console.warn('Sanctum CSRF cookie initialization note:', err);
  }
}

// ==========================================
// AUTHENTICATION APIs
// ==========================================

export interface UserResponse {
  id: number;
  uuid: string;
  name: string;
  email: string;
  google_id?: string | null;
  avatar_url?: string | null;
  phone?: string;
  role: 'user' | 'admin' | 'spi';
  status: 'active' | 'frozen';
  email_verified_at?: string | null;
  locale?: string;
  theme?: string;
  must_change_password?: boolean;
  default_address?: any;
  addresses?: any[];
}

export const authApi = {
  async getProviders(): Promise<{ google: boolean }> {
    try {
      const res = await apiClient.get<{ success: boolean; data: { google: boolean } }>('/auth/providers');
      return res.data.data;
    } catch {
      return { google: false };
    }
  },

  getGoogleLoginUrl(): string {
    return `${API_BASE_URL}/auth/google/redirect`;
  },

  getGoogleAuthUrl(role: string = 'user', next?: string): string {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (next) params.set('next', next);
    const q = params.toString();
    return `${API_BASE_URL}/auth/google/redirect${q ? `?${q}` : ''}`;
  },

  async getMe(): Promise<UserResponse> {
    const res = await apiClient.get<{ success: boolean; user: UserResponse }>('/auth/me');
    return res.data.user;
  },

  async login(credentials: { email: string; password: string; remember?: boolean; turnstile_token?: string }) {
    await getCsrfCookie();
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      token?: string;
      user: UserResponse;
      must_change_password?: boolean;
    }>('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('cde_auth_token', res.data.token);
    }
    return res.data;
  },

  async register(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    address?: string;
    turnstile_token?: string;
  }) {
    await getCsrfCookie();
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      token?: string;
      user: UserResponse;
    }>('/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('cde_auth_token', res.data.token);
    }
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API note:', err);
    } finally {
      localStorage.removeItem('cde_auth_token');
      localStorage.removeItem('cde_user_role');
      localStorage.removeItem('cde_auth');
      authChannel?.postMessage({ type: 'LOGOUT' });
    }
  },

  async updateProfile(data: { name?: string; phone?: string; locale?: string; theme?: string; address?: string }) {
    const res = await apiClient.patch('/auth/me', data);
    return res.data;
  },

  async updatePassword(data: { current_password: string; password: string; password_confirmation: string }) {
    const res = await apiClient.put('/auth/password', data);
    return res.data;
  },

  async forgotPassword(dataOrEmail: string | { email: string; turnstile_token?: string }, turnstile_token?: string) {
    const payload = typeof dataOrEmail === 'string'
      ? { email: dataOrEmail, turnstile_token }
      : dataOrEmail;
    const res = await apiClient.post('/auth/forgot-password', payload);
    return res.data;
  },

  async resetPassword(data: { token: string; email: string; password: string; password_confirmation: string; turnstile_token?: string }) {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },

  async resendVerification(turnstile_token?: string, email?: string) {
    const res = await apiClient.post<{ success: boolean; message: string; verification_link_dev?: string }>(
      '/auth/resend-verification',
      { turnstile_token, email }
    );
    return res.data;
  },

  async verifyEmail(id: number | string, hash: string, queryParams?: Record<string, string>) {
    const res = await apiClient.get<{ success: boolean; message: string; user: UserResponse }>(
      `/auth/verify-email/${id}/${hash}`,
      { params: queryParams }
    );
    return res.data;
  },
};

// ==========================================
// CATALOG & PUBLIC APIs
// ==========================================

export const catalogApi = {
  async getCategories() {
    const res = await apiClient.get('/categories');
    return res.data.data;
  },

  async getProducts(params?: {
    category?: string;
    grade?: string;
    variety?: string;
    search?: string;
    sort?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await apiClient.get('/products', { params });
    return res.data;
  },

  async getProduct(id: string | number) {
    const res = await apiClient.get(`/products/${id}`);
    return res.data.data;
  },

  async getReviews() {
    const res = await apiClient.get('/reviews');
    return res.data.data;
  },

  async submitReview(data: { customer_name: string; product_id?: number; rating: number; comment: string }) {
    const res = await apiClient.post('/reviews', data);
    return res.data.data;
  },

  async getSettings() {
    const res = await apiClient.get('/settings');
    return res.data.data;
  },

  async placeOrder(orderData: any) {
    const res = await apiClient.post('/orders', orderData);
    return res.data.data;
  },

  async lookupOrder(orderNumber: string) {
    const res = await apiClient.get(`/orders/lookup/${orderNumber}`);
    return res.data.data;
  },
};

// ==========================================
// CUSTOMER APIs
// ==========================================

export const customerApi = {
  async getMyOrders() {
    const res = await apiClient.get('/user/orders');
    return res.data.data;
  },

  async getOrder(id: string | number) {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data;
  },

  async cancelOrder(id: string | number) {
    const res = await apiClient.post(`/orders/${id}/cancel`);
    return res.data;
  },

  async uploadPaymentProof(id: string | number, formData: FormData) {
    const res = await apiClient.post(`/orders/${id}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const orderApi = {
  async createOrder(data: any) {
    const res = await apiClient.post('/orders', data);
    return {
      order: res.data.data,
      tracking_token: res.data.tracking_token || res.data.data?.tracking_token,
      message: res.data.message,
    };
  },

  async track(query: string, trackingToken?: string, phoneLast4?: string) {
    const params: Record<string, string> = {};
    if (trackingToken) params.tracking_token = trackingToken;
    if (phoneLast4) params.phone_last4 = phoneLast4;
    const res = await apiClient.get(`/orders/lookup/${query}`, { params });
    return res.data.data;
  },

  async lookup(code: string, trackingToken?: string, phoneLast4?: string) {
    return this.track(code, trackingToken, phoneLast4);
  },

  async getOrder(id: string | number) {
    return customerApi.getOrder(id);
  },

  async cancelOrder(id: string | number) {
    return customerApi.cancelOrder(id);
  },

  async uploadProof(id: string | number, form: FormData) {
    return customerApi.uploadPaymentProof(id, form);
  },
};

// ==========================================
// WISHLIST APIs
// ==========================================

export const wishlistApi = {
  async getWishlist() {
    const res = await apiClient.get('/wishlist');
    return res.data;
  },

  async addToWishlist(productId: number) {
    const res = await apiClient.post('/wishlist', { product_id: productId });
    return res.data;
  },

  async removeFromWishlist(productId: number) {
    const res = await apiClient.delete(`/wishlist/${productId}`);
    return res.data;
  },

  async toggleWishlist(productId: number) {
    const res = await apiClient.post('/wishlist/toggle', { product_id: productId });
    return res.data;
  },
};

// ==========================================
// SHOPPING CART APIs
// ==========================================

export const cartApi = {
  async getCart() {
    const res = await apiClient.get('/cart');
    return res.data;
  },

  async addItem(productId: number, quantity: number = 1, customSpecs?: any) {
    const res = await apiClient.post('/cart/items', {
      product_id: productId,
      quantity,
      custom_specs: customSpecs,
    });
    return res.data;
  },

  async updateItem(itemId: number, quantity: number) {
    const res = await apiClient.patch(`/cart/items/${itemId}`, { quantity });
    return res.data;
  },

  async removeItem(itemId: number) {
    const res = await apiClient.delete(`/cart/items/${itemId}`);
    return res.data;
  },

  async clearCart() {
    const res = await apiClient.delete('/cart');
    return res.data;
  },

  async syncCart(items: { product_id: number; quantity: number; custom_specs?: any }[]) {
    const res = await apiClient.post('/cart/sync', { items });
    return res.data;
  },
};

// ==========================================
// SHIPPING ADDRESS APIs
// ==========================================

export const addressApi = {
  async getAddresses() {
    const res = await apiClient.get('/addresses');
    return res.data.data;
  },

  async createAddress(data: {
    label?: string;
    recipient_name: string;
    phone?: string;
    address_line: string;
    city: string;
    province: string;
    postal_code: string;
    is_default?: boolean;
  }) {
    const res = await apiClient.post('/addresses', data);
    return res.data;
  },

  async updateAddress(id: number, data: any) {
    const res = await apiClient.put(`/addresses/${id}`, data);
    return res.data;
  },

  async deleteAddress(id: number) {
    const res = await apiClient.delete(`/addresses/${id}`);
    return res.data;
  },

  async setDefaultAddress(id: number) {
    const res = await apiClient.patch(`/addresses/${id}/set-default`);
    return res.data;
  },
};

// ==========================================
// NOTIFICATIONS APIs
// ==========================================

export const notificationApi = {
  async getNotifications(page: number = 1) {
    const res = await apiClient.get('/notifications', { params: { page } });
    return res.data;
  },

  async markRead(id: number) {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllRead() {
    const res = await apiClient.post('/notifications/mark-all-read');
    return res.data;
  },
};

// ==========================================
// GEMOLOGICAL CERTIFICATE APIs
// ==========================================

export const certificateApi = {
  async getCertificates(params?: { search?: string; page?: number }) {
    const res = await apiClient.get('/certificates', { params });
    return res.data;
  },

  async lookup(code: string) {
    const res = await apiClient.get(`/certificates/lookup/${code}`);
    return res.data;
  },

  async createCertificate(formData: FormData) {
    const res = await apiClient.post('/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async updateCertificate(id: number, formData: FormData) {
    const res = await apiClient.post(`/certificates/${id}?_method=PUT`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async deleteCertificate(id: number) {
    const res = await apiClient.delete(`/certificates/${id}`);
    return res.data;
  },
};

// ==========================================
// REPORT & REAL EXPORT APIs
// ==========================================

export const reportApi = {
  getSalesCsvDownloadUrl(params?: { payment_status?: string; order_status?: string }): string {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return `${API_BASE_URL}/admin/reports/sales/csv${query ? '?' + query : ''}`;
  },

  getInventoryCsvDownloadUrl(): string {
    return `${API_BASE_URL}/admin/reports/inventory/csv`;
  },
};

// ==========================================
// ADMIN APIs
// ==========================================

export const adminApi = {
  async getDashboard() {
    const res = await apiClient.get('/admin/dashboard');
    return res.data.data;
  },

  async getCustomers(params?: { search?: string; page?: number }) {
    const res = await apiClient.get('/admin/customers', { params });
    return res.data;
  },

  async getOrders(params?: { payment_status?: string; order_status?: string; search?: string; page?: number }) {
    const res = await apiClient.get('/orders', { params });
    return res.data;
  },

  async createProduct(productData: any) {
    const res = await apiClient.post('/products', productData);
    return res.data;
  },

  async updateProduct(id: number | string, data: any) {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id: number | string, reason?: string) {
    const res = await apiClient.delete(`/products/${id}`, { data: { reason } });
    return res.data;
  },

  async updateStock(id: number | string, delta: number, reason?: string) {
    const res = await apiClient.post(`/products/${id}/stock`, { delta, reason });
    return res.data;
  },

  async updateOrderStatus(id: number | string, orderStatus: string, notes?: string) {
    const res = await apiClient.put(`/orders/${id}/order-status`, { order_status: orderStatus, notes });
    return res.data;
  },

  async updatePaymentStatus(id: number | string, paymentStatus: string, notes?: string) {
    const res = await apiClient.put(`/orders/${id}/payment-status`, { payment_status: paymentStatus, notes });
    return res.data;
  },

  async updateTracking(id: number | string, trackingNumber: string, courier?: string) {
    const res = await apiClient.put(`/orders/${id}/tracking`, { tracking_number: trackingNumber, courier });
    return res.data;
  },

  async requestPaymentConfirmation(orderId: number | string, notes: string) {
    const res = await apiClient.post(`/orders/${orderId}/request-payment-confirmation`, { notes });
    return res.data;
  },

  async getStockMovements(params?: { type?: string; product_id?: number; search?: string; page?: number }) {
    const res = await apiClient.get('/admin/stock-movements', { params });
    return res.data;
  },

  async createCategory(data: { name: string; slug?: string; description?: string; icon?: string; is_active?: boolean }) {
    const res = await apiClient.post('/categories', data);
    return res.data;
  },

  async updateCategory(id: number | string, data: any) {
    const res = await apiClient.put(`/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: number | string) {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },
};

// ==========================================
// SPI APIs
// ==========================================

export const spiApi = {
  async getSummary() {
    const res = await apiClient.get('/spi/summary');
    return res.data;
  },

  async getApprovals(params?: { status?: string; type?: string; search?: string; page?: number }) {
    const res = await apiClient.get('/spi/approvals', { params });
    return res.data;
  },

  async approve(id: number | string, reason?: string) {
    const res = await apiClient.post(`/spi/approvals/${id}/approve`, { reason });
    return res.data;
  },

  async reject(id: number | string, reason: string) {
    const res = await apiClient.post(`/spi/approvals/${id}/reject`, { reason });
    return res.data;
  },

  async directExecute(actionType: string, targetId: string | number, note: string, oldValue?: any, newValue?: any) {
    const res = await apiClient.post('/spi/direct-execute', {
      action_type: actionType,
      target_id: targetId,
      note,
      old_value: oldValue,
      new_value: newValue,
    });
    return res.data;
  },

  async getAuditLogs(params?: {
    actor_role?: string;
    action?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await apiClient.get('/spi/audit-logs', { params });
    return res.data;
  },

  getAuditLogsCsvExportUrl(params?: { actor_role?: string; action?: string; date_from?: string; date_to?: string }): string {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return `${API_BASE_URL}/spi/audit-logs/export-csv${query ? '?' + query : ''}`;
  },

  async getStaff() {
    const res = await apiClient.get('/spi/staff');
    return res.data.data;
  },

  async createStaff(data: { name: string; email: string; phone?: string; role: 'admin' | 'spi' }) {
    const res = await apiClient.post('/spi/staff', data);
    return res.data;
  },

  async toggleFreezeStaff(id: number | string) {
    const res = await apiClient.patch(`/spi/staff/${id}/toggle-freeze`);
    return res.data;
  },

  async resetStaffPassword(id: number | string) {
    const res = await apiClient.post(`/spi/staff/${id}/reset-password`);
    return res.data;
  },

  async getAuditFindings(params?: { category?: string; severity?: string; status?: string; search?: string; page?: number }) {
    const res = await apiClient.get('/spi/audit-findings', { params });
    return res.data;
  },

  async createAuditFinding(data: {
    category: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
    assignee_id?: number;
    due_date?: string;
  }) {
    const res = await apiClient.post('/spi/audit-findings', data);
    return res.data;
  },

  async updateAuditFinding(id: number | string, data: any) {
    const res = await apiClient.put(`/spi/audit-findings/${id}`, data);
    return res.data;
  },

  async deleteAuditFinding(id: number | string) {
    const res = await apiClient.delete(`/spi/audit-findings/${id}`);
    return res.data;
  },

  getAuditFindingsReportUrl(): string {
    return `${API_BASE_URL}/spi/audit-findings/export-report`;
  },

  // S-2 SPI Pusat Kendali Endpoints
  async getOrders(params?: { status?: string; payment_status?: string; search?: string; start_date?: string; end_date?: string; page?: number; per_page?: number }) {
    const res = await apiClient.get('/spi/orders', { params });
    return res.data;
  },

  async getOrderDetail(id: number | string) {
    const res = await apiClient.get(`/spi/orders/${id}`);
    return res.data;
  },

  async updateOrderStatus(id: number | string, data: { order_status: string; notes?: string }) {
    const res = await apiClient.post(`/spi/orders/${id}/status`, data);
    return res.data;
  },

  async getStock(params?: { search?: string; low_stock_only?: boolean; page?: number; per_page?: number }) {
    const res = await apiClient.get('/spi/stock', { params });
    return res.data;
  },

  async adjustStock(id: number | string, data: { delta: number; reason: string }) {
    const res = await apiClient.post(`/spi/stock/${id}/adjust`, data);
    return res.data;
  },

  async getUsers(params?: { role?: string; status?: string; search?: string; page?: number; per_page?: number }) {
    const res = await apiClient.get('/spi/users', { params });
    return res.data;
  },

  async updateUserRole(id: number | string, role: string) {
    const res = await apiClient.put(`/spi/users/${id}/role`, { role });
    return res.data;
  },

  async toggleUserStatus(id: number | string) {
    const res = await apiClient.post(`/spi/users/${id}/toggle-status`);
    return res.data;
  },

  async getSettings() {
    const res = await apiClient.get('/spi/settings');
    return res.data;
  },

  async updateSettings(data: {
    store_name: string;
    contact_phone: string;
    bank_accounts: string;
    shipping_flat_cost: number;
    payment_timeout_hours: number;
  }) {
    const res = await apiClient.post('/spi/settings', data);
    return res.data;
  },

  async downloadSalesReport(params?: { start_date?: string; end_date?: string; status?: string; category?: string }): Promise<void> {
    const res = await apiClient.get('/spi/reports/sales/export', {
      params,
      responseType: 'blob',
    });
    let filename = 'Laporan_Penjualan_CDE_Pearls.xlsx';
    const disposition = res.headers['content-disposition'] || res.headers['Content-Disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  getSalesReportExportUrl(params?: { start_date?: string; end_date?: string; status?: string; category?: string }): string {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return `${API_BASE_URL}/spi/reports/sales/export${query ? '?' + query : ''}`;
  },
};

import axios from 'axios';
import type { Category, Product, Order, User, WhatsAppLead, Review, DashboardMetrics } from '../types';

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

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cde_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Catalog API
export const fetchCategories = async (): Promise<Category[]> => {
  const res = await apiClient.get('/categories');
  return res.data.data;
};

export const fetchProducts = async (params?: {
  category?: string;
  grade?: string;
  variety?: string;
  search?: string;
  sort?: string;
}): Promise<Product[]> => {
  const res = await apiClient.get('/products', { params });
  return res.data.data;
};

export const fetchProductById = async (id: string | number): Promise<Product> => {
  const res = await apiClient.get(`/products/${id}`);
  return res.data.data;
};

// Orders & Checkout API
export const createOrder = async (orderData: any): Promise<Order> => {
  const res = await apiClient.post('/orders', orderData);
  return res.data.data;
};

export const lookupOrder = async (orderNumber: string): Promise<Order> => {
  const res = await apiClient.get(`/orders/lookup/${orderNumber}`);
  return res.data.data;
};

export const fetchUserOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get('/user/orders');
  return res.data.data;
};

// WhatsApp Leads CRM
export const recordWhatsAppLead = async (data: {
  customer_name: string;
  phone: string;
  source?: string;
  product_id?: number;
  message?: string;
}): Promise<WhatsAppLead> => {
  const res = await apiClient.post('/leads', data);
  return res.data.data;
};

// Reviews API
export const fetchReviews = async (): Promise<Review[]> => {
  const res = await apiClient.get('/reviews');
  return res.data.data.data || res.data.data;
};

export const submitReview = async (reviewData: {
  customer_name: string;
  product_id?: number;
  rating: number;
  comment: string;
}): Promise<Review> => {
  const res = await apiClient.post('/reviews', reviewData);
  return res.data.data;
};

// Settings API
export const fetchSettings = async (): Promise<Record<string, string>> => {
  const res = await apiClient.get('/settings');
  return res.data.data;
};

export const updateSettings = async (settings: Record<string, string>) => {
  const res = await apiClient.post('/settings', settings);
  return res.data.data;
};

// Admin API
export const fetchAdminDashboard = async (): Promise<DashboardMetrics> => {
  const res = await apiClient.get('/admin/dashboard');
  return res.data.data;
};

export const fetchAllOrders = async (params?: {
  payment_status?: string;
  order_status?: string;
  search?: string;
}) => {
  const res = await apiClient.get('/orders', { params });
  return res.data.data;
};

export const updateOrderPaymentStatus = async (id: number, payment_status: string) => {
  const res = await apiClient.put(`/orders/${id}/payment-status`, { payment_status });
  return res.data.data;
};

export const updateOrderStatus = async (id: number, order_status: string) => {
  const res = await apiClient.put(`/orders/${id}/order-status`, { order_status });
  return res.data.data;
};

export const updateOrderTracking = async (id: number, tracking_number: string, courier?: string) => {
  const res = await apiClient.put(`/orders/${id}/tracking`, { tracking_number, courier });
  return res.data.data;
};

export const createProduct = async (productData: any): Promise<Product> => {
  const res = await apiClient.post('/products', productData);
  return res.data.data;
};

export const updateProduct = async (id: number, productData: any): Promise<Product> => {
  const res = await apiClient.put(`/products/${id}`, productData);
  return res.data.data;
};

export const deleteProduct = async (id: number) => {
  const res = await apiClient.delete(`/products/${id}`);
  return res.data;
};

export const updateProductStock = async (id: number, delta: number) => {
  const res = await apiClient.post(`/products/${id}/stock`, { delta });
  return res.data;
};

export const fetchAllLeads = async (params?: { status?: string }) => {
  const res = await apiClient.get('/leads', { params });
  return res.data.data;
};

export const updateLeadStatus = async (id: number, status: string) => {
  const res = await apiClient.put(`/leads/${id}/status`, { status });
  return res.data.data;
};

export const deleteReview = async (id: number) => {
  const res = await apiClient.delete(`/reviews/${id}`);
  return res.data;
};

export const fetchCustomers = async (): Promise<User[]> => {
  const res = await apiClient.get('/admin/customers');
  return res.data.data;
};

export const fetchAdminUsers = async (): Promise<User[]> => {
  const res = await apiClient.get('/admin/users');
  return res.data.data;
};

export const createAdminUser = async (data: any): Promise<User> => {
  const res = await apiClient.post('/admin/users', data);
  return res.data.data;
};

export const deleteAdminUser = async (id: number) => {
  const res = await apiClient.delete(`/admin/users/${id}`);
  return res.data;
};

export const fetchFinancialReports = async () => {
  const res = await apiClient.get('/admin/financial-reports');
  return res.data.data;
};

export const checkRealtimeEvents = async () => {
  const res = await apiClient.get('/realtime/events');
  return res.data;
};

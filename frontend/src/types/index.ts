export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  products_count?: number;
}

export interface Product {
  id: number;
  code?: string;
  category_slug?: string;
  category?: string | any;
  category_name?: string;
  name: string;
  price: number;
  original_price?: number;
  originalPrice?: number;
  discount_percent?: number;
  stock: number;
  rating?: number;
  reviews_count?: number;
  reviewCount?: number;
  pearl_type?: string;
  pearl_size?: string;
  pearl_color?: string;
  pearl_grade?: string;
  variety?: string;
  grade?: string;
  pearlSize?: string;
  origin?: string;
  weight?: string;
  metal?: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  featured?: boolean;
  isNew?: boolean;
  image: string;
  webp_url?: string;
  images?: Array<{ url: string; order?: number; is_primary?: boolean; alt?: string } | string>;
  description?: string;
  certificate?: string;
  formattedPrice?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id?: number;
  product_name: string;
  product_image?: string;
  pearl_size?: string;
  metal?: string;
  price: number;
  quantity: number;
  subtotal: number;
  custom_specs?: Record<string, any>;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes?: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  insurance_cost: number;
  total: number;
  payment_method: string;
  payment_status: 'WAITING_PAYMENT' | 'PAYMENT_REVIEW' | 'PAID' | 'FAILED' | 'REFUNDED';
  order_status: 'PENDING' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  tracking_number?: string;
  courier?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'OWNER';
  address?: string;
  created_at?: string;
}

export interface WhatsAppLead {
  id: number;
  customer_name: string;
  phone: string;
  source: string;
  product_id?: number;
  message?: string;
  status: 'NEW' | 'CONTACTED' | 'DEAL' | 'CANCELLED';
  created_at: string;
  product?: Product;
}

export interface Review {
  id: number;
  user_id?: number;
  product_id?: number;
  customer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  id?: number;
  product: Product;
  quantity: number;
  customSpecs?: Record<string, any>;
}

export interface DashboardMetrics {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_pearl_stock: number;
  recent_orders: Order[];
  recent_leads: WhatsAppLead[];
}

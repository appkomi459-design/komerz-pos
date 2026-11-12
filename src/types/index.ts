export type BusinessRole = 'owner' | 'admin' | 'manager' | 'cashier';

export type BusinessType =
  | 'retail'
  | 'minimarket'
  | 'hardware'
  | 'restaurant'
  | 'pharmacy'
  | 'stationery'
  | 'clothing'
  | 'services'
  | 'general';

export type BusinessStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string | null;
  business_type: BusinessType;
  logo_url: string | null;
  cover_url: string | null;
  country: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
  timezone: string;
  status: BusinessStatus;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  business?: Business;
  profile?: Profile;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  receipt_footer: string | null;
  tax_percentage: number;
  tax_id_number: string | null;
  invoice_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_branches: number;
  max_users: number;
  max_products: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface AuditLog {
  id: string;
  business_id: string | null;
  user_id: string | null;
  action: string;
  entity: string;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
  user?: Profile;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  identification: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  business_id: string;
  branch_id: string | null;
  customer_id: string | null;
  user_id: string | null;
  invoice_number: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  status: 'completed' | 'cancelled' | 'refunded';
  created_at: string;
  customer?: Customer;
}

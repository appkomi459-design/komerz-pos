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

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  contact_person: string | null;
  identification: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
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
  amount_received?: number;
  change_given?: number;
  created_at: string;
  customer?: Customer;
}

export interface CashMovement {
  id: string;
  business_id: string;
  session_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CashSession {
  id: string;
  business_id: string;
  branch_id?: string | null;
  user_id?: string | null;
  opened_by: string | null;
  closed_by?: string | null;
  opening_balance: number;
  closing_balance?: number | null;
  expected_balance?: number | null;
  difference?: number | null;
  total_sales: number;
  total_cash_sales: number;
  total_transfer_sales: number;
  total_change_given: number;
  total_expenses: number;
  sales_count: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string | null;
  notes?: string | null;
  created_at: string;
  movements?: CashMovement[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at?: string;
  product?: Product;
}

export interface Purchase {
  id: string;
  business_id: string;
  branch_id?: string | null;
  supplier_id: string | null;
  user_id?: string | null;
  purchase_number: string;
  invoice_number?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: 'paid' | 'pending';
  status: 'completed' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
}

export interface Expense {
  id: string;
  business_id: string;
  branch_id?: string | null;
  user_id?: string | null;
  category: string;
  description: string;
  amount: number;
  payment_source: 'cash_register' | 'bank_account' | 'owner_funds' | string;
  receipt_number?: string | null;
  paid_to?: string | null;
  expense_date: string;
  created_at: string;
  updated_at?: string;
}

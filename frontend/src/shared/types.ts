export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  image_url: string;
  available_sizes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  size: string;
  color: string;
  stock_quantity: number;
  image_url?: string;
  cost_price?: number;
  selling_price?: number;
  available_sizes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  phone_number: string;
  country?: string;
  status: 'pending' | 'approved' | 'cancelled' | 'confirmed' | 'completed';
  created_at: string;
  updated_at: string;
  approved_by?: {
    admin_id: string;
    admin_name: string;
    timestamp: string;
  };
  deleted_by?: {
    admin_id: string;
    admin_name: string;
    timestamp: string;
  };
}

export interface CreateOrderRequest {
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  phone_number: string;
  country: string;
}

export interface UpdateOrderStatusRequest {
  status: 'approved' | 'cancelled';
}

export interface Analytics {
  total_orders: number;
  approved_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_products: number;
  total_revenue?: number;
  total_profit?: number;
  inventory_value?: number;
  low_stock_variants?: any[];
  out_of_stock_variants?: any[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  brand: string;
  sku: string | null;
  stock_quantity: number;
  images: string[];
  featured: boolean;
  bestseller: boolean;
  new_arrival: boolean;
  active: boolean;
  rating: number;
  created_at: string;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  variation_name: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  image: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  slug: string;
  variationId: string | null;
  variationName: string | null;
  unitPrice: number;
  quantity: number;
  image: string | null;
  maxStock: number;
}

export interface DeliveryFee {
  state: string;
  fee: number;
}

export interface StoreSettings {
  store_name: string;
  whatsapp_number: string;
  support_phone: string;
  support_email: string;
  store_address: string;
  paystack_public_key: string | null;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "verification_pending"
  | "paid"
  | "failed"
  | "rejected";

export type PaymentMethod = "pay_on_delivery" | "paystack" | "bank_transfer";

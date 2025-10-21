export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  city?: string;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  category: string | Category;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  category: string | Category;
  subCategory?: string | SubCategory;
  badge?: string;
  stockQuantity: number;
  inStock: boolean;
  image?: string;
  gallery?: string[];
  reviews?: number;
  createdAt: string;
}

export interface OrderItem {
  product: string | Product;
  quantity: number;
  price: number;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  total: number;
  finalTotal: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
}

export interface ModalState {
  isOpen: boolean;
  product?: Product | null;
  category?: Category | SubCategory | null;
  type?: 'category' | 'subcategory';
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
}
export interface User {
  userId: string;
  email: string;
  role: 'CASHIER' | 'ADMIN';
  tenantId: string;
}

export interface Product {
  _id: string;
  title: string;
  price: number;
  stockCount: number;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  _id: string;
  status: string;
  items: OrderItem[];
  grandTotal: number;
  createdAt: string;
  paidAt?: string;
}

export interface ReportResult {
  totalRevenue: number;
  totalMargin: number;
  topProducts: {
    productId: string;
    title: string;
    totalQuantity: number;
    totalRevenue: number;
    totalMargin: number;
  }[];
}
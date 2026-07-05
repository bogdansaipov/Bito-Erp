import { Types } from 'mongoose';

export enum UserRole{
    CASHIER = 'CASHIER',
    ADMIN = 'ADMIN'
}

export enum PaymentStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    PAID = 'PAID'
}

export interface ITenant {
  _id: Types.ObjectId;
  title: string;
}

export interface IUser {
    _id: Types.ObjectId,
    email: string,
    passwordHash: string,
    tenantId: Types.ObjectId,
    role: UserRole.ADMIN | UserRole.CASHIER
}

export interface IOrderitem {
    productId: Types.ObjectId,
    title: string,
    quantity: number,
    unitPrice: number,
    unitCost: number,
    lineTotal: number
}

export interface IOrder {
    _id: Types.ObjectId,
    tenantId: Types.ObjectId,
    cashierId: Types.ObjectId,
    status: PaymentStatus.PENDING_PAYMENT | PaymentStatus.PAID,
    items: IOrderitem[],
    grandTotal: number,
    createdAt: Date,
    paidAt?: Date
}

export interface IProduct {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    title: string;
    cost: number;
    price: number;
    stockCount: number;
}

export interface ProductResponse {
  _id: string;
  tenantId: string;
  title: string;
  price: number;
  stockCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IProcessedEvent {
  eventId: string,
  orderId: string;
  processedAt: Date;
};

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

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole.CASHIER | UserRole.ADMIN
  tenantId: string;
}
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { IOrderitem, PaymentStatus } from '../types';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderResponse {
  _id: string;
  tenantId: string;
  cashierId: string;
  status: string;
  items: Omit<IOrderitem, 'unitCost'>[];
  grandTotal: number;
  createdAt: Date;
  paidAt?: Date;
}

export const createOrder = async (
  tenantId: string,
  cashierId: string,
  cartItems: CartItem[]
): Promise<OrderResponse> => {

  // Starting MongoDB session for transaction
  const session = await mongoose.startSession();

  try {
    let createdOrder: OrderResponse | null = null;

    await session.withTransaction(async () => {
      // 1. We fetch all products in one query — no N+1
      const productIds = cartItems.map(item => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        tenantId                    // tenant scope — can't order another tenant's products
      }).session(session);

      // 2. Then I validate all products exist
      if (products.length !== cartItems.length) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      // 3. We also build order items using SERVER prices, check stock
      const orderItems: IOrderitem[] = [];
      const bulkStockUpdates = [];

      for (const cartItem of cartItems) {
        const product = products.find(
          p => p._id.toString() === cartItem.productId
        );

        if (!product) throw new Error('PRODUCT_NOT_FOUND');

        // Stock checking then we  reject if is is insufficient
        if (product.stockCount < cartItem.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.title}`);
        }

        // Server-side prices client price is completely ignored
        const unitPrice = product.price;
        const unitCost = product.cost;
        const lineTotal = unitPrice * cartItem.quantity;

        orderItems.push({
          productId: product._id,
          title: product.title,
          quantity: cartItem.quantity,
          unitPrice,
          unitCost,   // stored for admin reports, never exposed to cashier
          lineTotal,
        });

        bulkStockUpdates.push({
          updateOne: {
            filter: {
              _id: product._id,
              tenantId,
              stockCount: { $gte: cartItem.quantity } 
            },
            update: { $inc: { stockCount: -cartItem.quantity } }
          }
        });
      }

      // 4. In this step I decrement stock atomically
      const bulkResult = await Product.bulkWrite(bulkStockUpdates, { session });

      // If any update didn't match stock changed between read and write
      if (bulkResult.modifiedCount !== cartItems.length) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      // 5. Calculating grand total
      const grandTotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

      // 6. Creating order document
      const [order] = await Order.create([{
        tenantId,
        cashierId,
        status: PaymentStatus.PENDING_PAYMENT,
        items: orderItems,
        grandTotal,
      }], { session });

      // 7. What I do in this step is just shape response where we exclude the unitCost out of the response
      createdOrder = {
        _id: order._id.toString(),
        tenantId: order.tenantId.toString(),
        cashierId: order.cashierId.toString(),
        status: order.status,
        items: order.items.map(({ productId, title, quantity, unitPrice, lineTotal }) => ({
          productId,
          title,
          quantity,
          unitPrice,
          lineTotal,
        })),
        grandTotal: order.grandTotal,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      };
    });

    if (!createdOrder) throw new Error('ORDER_CREATION_FAILED');
    return createdOrder;

  } finally {
    await session.endSession();
  }
};

export const getOrder = async (
  orderId: string,
  tenantId: string
): Promise<OrderResponse> => {
  const order = await Order.findOne({
    _id: orderId,
    tenantId       
  }).lean();

  if (!order) throw new Error('ORDER_NOT_FOUND');

  return {
    _id: order._id.toString(),
    tenantId: order.tenantId.toString(),
    cashierId: order.cashierId.toString(),
    status: order.status,
    items: order.items.map(({ productId, title, quantity, unitPrice, lineTotal }) => ({
      productId,
      title,
      quantity,
      unitPrice,
      lineTotal,
    })),
    grandTotal: order.grandTotal,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
};
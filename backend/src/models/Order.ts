import { Schema, model } from 'mongoose';
import { IOrder, IOrderitem, PaymentStatus } from '../types';

const OrderItemSchema = new Schema<IOrderitem>({
    productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
    title: {type: String, required: true},
    quantity: {type: Number, required: true},
    unitPrice: {type: Number, required: true},
    unitCost: {type:Number, required: true},
    lineTotal: {type: Number, required: true}
}, {_id: false});

const OrderSchema = new Schema<IOrder>({
    tenantId:   { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    cashierId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status:     { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING_PAYMENT },
    items:      { type: [OrderItemSchema], required: true },
    grandTotal: { type: Number, required: true },
    paidAt:     { type: Date },
}, {timestamps: true});

OrderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', OrderSchema);
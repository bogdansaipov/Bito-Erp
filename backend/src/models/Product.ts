import { Schema, model } from "mongoose";
import { IProduct } from "../types";

const ProductSchema = new Schema<IProduct>({
    tenantId: {type: Schema.Types.ObjectId, ref: 'Tenant', required: true},
    title: {type: String, required: true},
    cost: {type: Number, required: true},
    price: {type: Number, required: true},
    stockCount: {type: Number, required: true, min: 0},
});

ProductSchema.index({tenantId: 1, title: 'text'});

export const Product = model<IProduct>('Product', ProductSchema);
import { Schema, model } from "mongoose";
import { ITenant } from "../types";

const TenantSchema = new Schema<ITenant>({
    title: {type: String, required: true},
});

export const Tenant = model<ITenant>('Tenant', TenantSchema);
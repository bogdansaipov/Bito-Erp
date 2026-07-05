import { Schema, model } from "mongoose";
import { IUser, UserRole } from "../types";

const UserSchema = new Schema<IUser>({
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: true},
    tenantId: {type: Schema.Types.ObjectId, ref: 'Tenant', required: true},
    role: { type: String, enum: Object.values(UserRole), required: true }
});

export const User = model<IUser>('User', UserSchema);
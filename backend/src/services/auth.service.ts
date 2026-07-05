import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { JwtPayload } from '../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

export const login = async ({ email, password }: LoginParams): Promise<AuthResponse> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    tenantId: user.tenantId.toString(),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' });

  return {
    token,
    user: {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId.toString(),
    },
  };
};
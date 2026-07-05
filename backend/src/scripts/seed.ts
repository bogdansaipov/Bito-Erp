import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { UserRole } from '../types';

dotenv.config();

const seed = async () => {+
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');

  await Tenant.deleteMany({});
  await User.deleteMany({});
  await Product.deleteMany({});
  console.log('Cleared existing data');

  const tenant1 = await Tenant.create({ title: 'Coffee Shop' });
  const tenant2 = await Tenant.create({ title: 'Electronics Store' });
  console.log('Created tenants');

  const passwordHash = await bcrypt.hash('password123', 10);

  await User.create([
    {
      email: 'admin@coffee.com',
      passwordHash,
      tenantId: tenant1._id,
      role: UserRole.ADMIN,
    },
    {
      email: 'cashier@coffee.com',
      passwordHash,
      tenantId: tenant1._id,
      role: UserRole.CASHIER,
    },
  ]);

  await User.create([
    {
      email: 'admin@electronics.com',
      passwordHash,
      tenantId: tenant2._id,
      role: UserRole.ADMIN,
    },
    {
      email: 'cashier@electronics.com',
      passwordHash,
      tenantId: tenant2._id,
      role: UserRole.CASHIER,
    },
  ]);
  console.log('Created users');

  await Product.create([
    {
      tenantId: tenant1._id,
      title: 'Espresso',
      cost: 0.5,
      price: 3.0,
      stockCount: 100,
    },
    {
      tenantId: tenant1._id,
      title: 'Cappuccino',
      cost: 0.8,
      price: 4.5,
      stockCount: 100,
    },
    {
      tenantId: tenant1._id,
      title: 'Croissant',
      cost: 0.6,
      price: 2.5,
      stockCount: 50,
    },
    {
      tenantId: tenant1._id,
      title: 'Water Bottle',
      cost: 0.2,
      price: 1.5,
      stockCount: 5,
    },
  ]);

  await Product.create([
    {
      tenantId: tenant2._id,
      title: 'USB Cable',
      cost: 2.0,
      price: 9.99,
      stockCount: 30,
    },
    {
      tenantId: tenant2._id,
      title: 'Phone Case',
      cost: 3.0,
      price: 14.99,
      stockCount: 20,
    },
  ]);
  console.log('Created products');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Tenant 1 — Coffee Shop:');
  console.log('  admin@coffee.com / password123');
  console.log('  cashier@coffee.com / password123');
  console.log('Tenant 2 — Electronics Store:');
  console.log('  admin@electronics.com / password123');
  console.log('  cashier@electronics.com / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
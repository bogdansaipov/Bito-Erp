import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import webhookRouter from './routes/webhook';
import reportsRouter from './routes/reports';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter)
app.use('/api/webhooks', webhookRouter)
app.use('/api/reports', reportsRouter);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bito';

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

export default app;
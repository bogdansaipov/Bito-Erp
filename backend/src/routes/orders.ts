import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { createOrder, getOrder } from '../services/order.service';

const router = Router();

router.post('/', authenticate, async(req: Request, res: Response): Promise<void> => {
    try {
        const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    const order = await createOrder(
      req.user!.tenantId,
      req.user!.userId,
      items
    );

    res.status(201).json(order);
    
    } catch (err) {
        if (err instanceof Error) {
      if (err.message === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({ message: 'One or more products not found' });
        return;
      }
      if (err.message.startsWith('INSUFFICIENT_STOCK')) {
        const productName = err.message.split(':')[1];
        res.status(409).json({
          message: `Insufficient stock${productName ? ` for ${productName}` : ''}`,
          code: 'INSUFFICIENT_STOCK'
        });
        return;
      }
    }
    res.status(500).json({ message: 'Server error' });
    }
}) 

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await getOrder(req.params.id as string, req.user!.tenantId);
    res.json(order);
  } catch (err) {
    if (err instanceof Error && err.message === 'ORDER_NOT_FOUND') {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
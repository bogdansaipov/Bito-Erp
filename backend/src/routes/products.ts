import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getProducts } from '../services/product.service';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '10' } = req.query;

    const result = await getProducts({
      tenantId: req.user!.tenantId,
      search: search as string | undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
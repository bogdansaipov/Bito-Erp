import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getSalesReport } from '../services/report.service';
import { UserRole } from '../types';

const router = Router();

router.get('/sales',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({ message: 'from and to query params required' });
        return;
      }

      const fromDate = new Date(from as string);
      const toDate = new Date(to as string);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        res.status(400).json({ message: 'Invalid date format' });
        return;
      }

      const report = await getSalesReport(
        req.user!.tenantId,
        fromDate,
        toDate
      );

      res.json(report);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
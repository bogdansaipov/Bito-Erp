import { Router, Request, Response } from 'express';
import { login } from '../services/auth.service';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password required' });
      return;
    }

    const result = await login({ email, password });
    res.json(result);

  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { 
  verifyWebhookSignature, 
  processPaymentWebhook, 
  WebhookPayload 
} from '../services/webhook.service';

const router = Router();

router.post('/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;

    console.log('=== WEBHOOK DEBUG ===');
    console.log('Is Buffer:', Buffer.isBuffer(req.body));
    console.log('Body type:', typeof req.body);
    console.log('Body value:', req.body);
    
    const rawBody = Buffer.isBuffer(req.body) 
      ? req.body.toString('utf8')
      : JSON.stringify(req.body);

    console.log('Raw body string:', rawBody);
    console.log('Signature received:', signature);

    const expected = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    console.log('Expected signature:', expected);
    console.log('Signatures match:', signature === expected);
    console.log('===================');

    if (!signature) {
      res.status(401).json({ message: 'Missing signature' });
      return;
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;
    const { eventId, orderId, tenantId, status } = payload;

    if (!eventId || !orderId || !tenantId || status !== 'paid') {
      res.status(400).json({ message: 'Invalid payload' });
      return;
    }

    await processPaymentWebhook({ eventId, orderId, tenantId, status });
    res.status(200).json({ message: 'OK' });

  } catch (err) {
    console.error('=== WEBHOOK ROUTE ERROR ===');
    console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('Error message:', err instanceof Error ? err.message : err);
    console.error('Stack:', err instanceof Error ? err.stack : 'no stack');
    console.error('===========================');

    if (err instanceof Error && err.message === 'ORDER_NOT_FOUND') {
      res.status(200).json({ message: 'OK' });
      return;
    }
    if (err instanceof Error && err.message === 'WRONG_TENANT') {
      res.status(200).json({ message: 'OK' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
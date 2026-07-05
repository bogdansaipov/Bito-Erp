import crypto from 'crypto';
import { Order } from '../models/Order';
import { ProcessedEvent } from '../models/ProcessedEvent';
import { PaymentStatus } from '../types';
import { invalidateReportCache } from './report.service';

export interface WebhookPayload {
  eventId: string;
  orderId: string;
  tenantId: string;
  status: 'paid';
}

export const verifyWebhookSignature = (
  rawBody: string,
  signature: string
): boolean => {
  const expectedSig = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
};

export const processPaymentWebhook = async (
  payload: WebhookPayload
): Promise<void> => {
  const { eventId, orderId, tenantId } = payload;

  console.log('=== PROCESS WEBHOOK ===');
  console.log('eventId:', eventId);
  console.log('orderId:', orderId);
  console.log('tenantId:', tenantId);

  // case 1: here we focus on idempotency check // dupliacate Events
  try {
    const alreadyProcessed = await ProcessedEvent.findOne({ eventId });
    console.log('Already processed?', !!alreadyProcessed);
    if (alreadyProcessed) {
      console.log(`Webhook ${eventId} already processed, skipping`);
      return;
    }
  } catch (err) {
    console.error('Error checking ProcessedEvent:', err);
    throw err;
  }

  // case 2: finding order
  let order;
  try {
    order = await Order.findById(orderId);
    console.log('Order found?', !!order);
    console.log('Order tenantId:', order?.tenantId?.toString());
    console.log('Order status:', order?.status);
  } catch (err) {
    console.error('Error finding order:', err);
    throw err;
  }

  if (!order) {
    console.log('Order not found, throwing ORDER_NOT_FOUND');
    throw new Error('ORDER_NOT_FOUND');
  }

  // case 3:  making a small tenant check to see if they are equal and the same
  const orderTenant = order.tenantId.toString();
  console.log('Tenant match?', orderTenant === tenantId, '|', orderTenant, 'vs', tenantId);
  if (orderTenant !== tenantId) {
    console.log('Tenant mismatch, throwing WRONG_TENANT');
    throw new Error('WRONG_TENANT');
  }

  // case 4:here we also handle the case when the order was already paid
  if (order.status === PaymentStatus.PAID) {
    console.log('Order already PAID, recording eventId and returning');
    try {
      await ProcessedEvent.create({ eventId, orderId, processedAt: new Date() });
    } catch (err) {
      console.error('Error creating ProcessedEvent (already paid case):', err);
    }
    return;
  }

  // updating order to PAID just changing the status
  console.log('Updating order to PAID...');
  try {
    order.status = PaymentStatus.PAID;
    order.paidAt = new Date();
    await order.save();
    console.log('Order saved as PAID');
  } catch (err) {
    console.error('Error saving order:', err);
    throw err;
  }

  // recording processed event
  console.log('Creating ProcessedEvent record...');
  try {
    await ProcessedEvent.create({ eventId, orderId, processedAt: new Date() });
    console.log('ProcessedEvent created');
  } catch (err) {
    console.error('Error creating ProcessedEvent:', err);
    throw err;
  }

  // and last but not least invalidate cache
  console.log('Invalidating report cache...');
  try {
    await invalidateReportCache(tenantId);
    console.log('Cache invalidated');
  } catch (err) {
    console.error('Error invalidating cache:', err);
  }

  console.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===');
};
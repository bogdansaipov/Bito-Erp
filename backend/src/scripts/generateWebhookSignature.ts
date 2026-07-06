import crypto from 'crypto';

const secret = 'mysecretkey123'; 

const payload = JSON.stringify({
  eventId: 'evt_005',
  orderId: '6a4a5a1cc7af266b5d927ec4',
  tenantId: '6a49fae3c7fc8d70d18d680f',
  status: 'paid'
});

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('Payload:', payload);
console.log('Signature:', signature);
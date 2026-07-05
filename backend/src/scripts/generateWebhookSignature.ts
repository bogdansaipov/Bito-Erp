import crypto from 'crypto';

const secret = 'mysecretkey123'; 

const payload = JSON.stringify({
  eventId: 'evt_004',
  orderId: '6a4a2b9f508c9d73785c181e',
  tenantId: '6a49fae3c7fc8d70d18d680f',
  status: 'paid'
});

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('Payload:', payload);
console.log('Signature:', signature);
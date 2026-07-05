# BITO POS — Multi-Tenant Point of Sale

A full-stack POS SaaS built with Node.js/Express, MongoDB, React/TypeScript, and Docker. Supports multiple tenants with complete data isolation, atomic order creation, HMAC-verified webhooks, and a role-based reporting system.

## Stack

- **Backend:** Node.js + Express + TypeScript + Mongoose
- **Frontend:** React + TypeScript + Vite
- **Database:** MongoDB (replica set for transactions)
- **Cache:** Redis
- **Infrastructure:** Docker + Docker Compose

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Docker Compose
- Node.js 20+ (only needed for local development outside Docker)

---

## Quick Start (Docker — recommended)

This runs everything: MongoDB replica set, Redis, backend, and frontend.

**1. Clone the repo:**
```bash
git clone https://github.com/your-username/bito-pos.git
cd bito-pos
```

**2. Start all services:**
```bash
docker compose up --build
```

Wait for these messages in the logs:
```
backend-1  | MongoDB connected
backend-1  | Redis connected
backend-1  | Server running on port 3000
frontend-1 | VITE ready in Xms
```

**3. Seed the database:**

Open a new terminal and run:
```bash
docker exec -it bito-pos-backend-1 npx ts-node src/scripts/seed.ts
```

You should see:
```
Connected to MongoDB
Created tenants
Created users
Created products
=== SEED COMPLETE ===
```

**4. Open the app:**

Frontend: [http://localhost:5173](http://localhost:5173)
Backend API: [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Cashier (Coffee Shop) | cashier@coffee.com | password123 |
| Admin (Coffee Shop) | admin@coffee.com | password123 |
| Cashier (Electronics) | cashier@electronics.com | password123 |
| Admin (Electronics) | admin@electronics.com | password123 |

---

## End-to-End Flow

### 1. Login
- Go to `http://localhost:5173`
- Login as cashier → redirected to product catalog
- Login as admin → redirected to sales report

### 2. Place an order (as cashier)
- Search and add products to cart
- Click Checkout
- Note the order ID from the URL (`/receipt/:orderId`)

### 3. Confirm payment (simulated webhook)

Update `backend/src/scripts/generateWebhookSignature.ts` with your orderId and tenantId (get tenantId from your JWT at [jwt.io](https://jwt.io)):

```typescript
const payload = JSON.stringify({
  eventId: 'evt_001',           // any unique string
  orderId: 'YOUR_ORDER_ID',     // from receipt URL
  tenantId: 'YOUR_TENANT_ID',   // from JWT payload
  status: 'paid'
});
```

Generate signature:
```bash
docker exec -it bito-pos-backend-1 npx ts-node src/scripts/generateWebhookSignature.ts
```

Send webhook via Postman or curl:
```bash
curl -X POST http://localhost:3000/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: YOUR_GENERATED_SIGNATURE" \
  -d '{"eventId":"evt_001","orderId":"YOUR_ORDER_ID","tenantId":"YOUR_TENANT_ID","status":"paid"}'
```

The receipt page updates to PAID automatically within 3 seconds.

### 4. View sales report (as admin)
- Sign out, login as `admin@coffee.com`
- Click Generate Report
- View revenue, margin, and top products

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/products?search=&page=&limit=` | Any | Search product catalog |
| POST | `/api/orders` | Any | Place an order |
| GET | `/api/orders/:id` | Any | Get order / receipt |
| POST | `/api/webhooks/payment` | HMAC | Payment confirmation |
| GET | `/api/reports/sales?from=&to=` | Admin only | Sales report |

---

## Environment Variables

The app uses these environment variables (set in `docker-compose.yml` for Docker, or `backend/.env` for local dev):

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo:27017/bito?replicaSet=rs0` |
| `JWT_SECRET` | Secret for signing JWTs | `supersecretkey` |
| `WEBHOOK_SECRET` | HMAC secret for webhook verification | `mysecretkey123` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `PORT` | Backend port | `3000` |

---

## Project Structure

```
bito-pos/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/       # Auth + role guards
│   │   ├── types/           # TypeScript interfaces
│   │   └── scripts/         # Seed + webhook helper scripts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Products, Receipt, Report
│   │   ├── context/         # Auth context
│   │   └── api/             # Axios instance
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── DECISIONS.md
└── README.md
```

---

## Key Technical Decisions

See [DECISIONS.md](./DECISIONS.md) for full reasoning. Summary:

- **Tenant isolation** — `tenantId` injected from JWT into every DB query, never from request input
- **No oversell** — MongoDB multi-document transactions with conditional `bulkWrite` on stock
- **Server-side pricing** — client sends only `productId` + `quantity`, price/cost re-read from DB
- **Margin protection** — `cost` excluded via `.select('-cost')` at DB level, never in React
- **Webhook idempotency** — `ProcessedEvent` collection with unique index on `eventId`
- **Report caching** — Cache-aside with Redis, invalidated on every new paid order

---

## Stopping the App

```bash
docker compose down
```

To also remove the database volume (full reset):
```bash
docker compose down -v
```
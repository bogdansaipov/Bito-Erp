# DECISIONS.md

## Data Model

1. Users
- id
- email
- passwordHash
-tenantId
-role -> Cashier | Admin
2. Tenants
-id
-title
3. Products
-id
-tenantId
-title
-cost
-price
-stockCount
4. Orders
-tenantId
-cashierId
-status -> PENDING_PAYMENT | PAID
-items[{product_id, title, quantity, unitPrice, unitCost, lineTotal(quantity x unitPrice)}]
-grandTotal (the sum of all lineTotal fields)
-createdAt
-paidAt
5. ProcessedEvents
-eventId
-orderId
-processedAt

## 1. Tenant + Role flow
So the way the tenant identification and userRole flow is at Login, the server reads the User document and signs a JWT attaching to payload data such as their ids, emails, tenantId they work for, and their role(either Admin or Cashier). The "tenant_id" is never passed by the client but only exclusively from the verified User record. Every protected route has to pass through Auth middleware that verifies JWT signature and attaches the decoded payload of JWT to req.user. A separate requireRole('admin') guard blocks cashier from accessing admin-only endpoints.

At the data layer every query against Products, Orders and Reports scopes to a specific tenant with the help of direct retrieval of a tenantId from the user token and never from request input. This solves the cross-tenant leaks literally impossible to happen and it also makes frontend developers not to depend on per-route tenantId passing which simplifies the whole workflow.

Role is stored as an enum (Cashier | Admin) on the User document and
copied into the token at login. So in total the signed token is the source of truth.

## 2. N+1 fix and indexes
So, generally the N+1 problem happens when we make a single query to get a list of something but then additional query to fetch related data per item so lets say to fetch 10 products with N+1 problem we would make 11 requests which could be  resolved by just one single db query.

Here is how I fixed it in the app: we fetch all required producs all in one single query using '$in' operator, then resolve relationships in memory: `Product.find({ _id: { $in: productIds }, tenantId })`. This gives us exactly 2 queries total regardless of result size one for the products, one for the count (pagination). Both run in parallel via `Promise.all()`.

**Indexes:**

Products: `{ tenantId: 1, title: 'text' }`
- `tenantId` first — every query is tenant-scoped, it's the 
  most selective filter, narrows the dataset dramatically 
  before any other filter runs
- `title: 'text'` — enables efficient full-text search for 
  the `search=` query param via `$text: { $search: query }`
  without it MongoDB would scan every product document

Orders: `{ tenantId: 1, status: 1, createdAt: -1 }`
- `tenantId` first — same reasoning, every order query is 
  tenant-scoped
- `status` second — admin report filters by `status: 'PAID'` 
  only, this eliminates pending orders before date filtering
- `createdAt: -1` last and descending — range filter always 
  goes last in compound indexes, descending matches the 
  natural read order (newest first) so sorting is free

## 3. Client cart trust boundary
From the client we only accept:
- `productId` — to identify which product
- `quantity` — how many units the cashier wants to buy

Everything else is re-derived on the server at order creation:
- `price` — re-read from Product document (server truth)
- `cost` — re-read from Product document (never from client)
- `stockCount` — re-read and validated against requested quantity
- `lineTotal` — computed as `quantity × server price`
- `grandTotal` — summed from all lineTotals server-side

Even if the client sends price, cost, or stock in the request 
body they are completely ignored — never touched in order logic.
The client's only power is "I want X units of product Y."
Whether that's possible and at what price is decided entirely 
by the server.

## 4. No-oversell guarantee
We use MongoDB multi-document transactions combined with a 
conditional bulkWrite to guarantee atomicity across multiple 
products in a single order.

The flow:
1. Start a MongoDB session and transaction
2. Read all required products with their current stockCount
3. Validate stock is sufficient for each item in memory
4. Run bulkWrite with a conditional filter:
   `{ _id: productId, stockCount: { $gte: requestedQuantity } }`
   This means the update only applies if stock is STILL 
   sufficient at write time — not just at read time
5. If modifiedCount < expected — another cashier grabbed the 
   last unit between our read and write → abort, DB unchanged
6. Create the order document in the same transaction
7. Commit — both stock decrements and order creation land 
   atomically or not at all

**The concurrency scenario:**
Two cashiers buy the last unit simultaneously. Both read 
stockCount: 1. Both pass the in-memory check. Both attempt 
bulkWrite. MongoDB processes them sequentially at the write 
level — one succeeds, one matches 0 documents. The losing 
transaction detects modifiedCount mismatch and throws 
INSUFFICIENT_STOCK. The DB is left with stockCount: 0 and 
exactly one order created. No oversell.

**Where it breaks:**
Requires MongoDB replica set — transactions are not supported 
on standalone instances. Mitigated by initializing a 
single-node replica set in Docker Compose via rs.initiate().
Under extremely high write contention on a single product, 
many transactions could fail and require client retry — 
acceptable for a POS context where true simultaneous 
purchases of the same last item are rare.

## 5. Margin isolation at data layer
The `cost` field on Product and `unitCost` field on Order items
are never included in any cashier-facing API response.

What I implemented for the isolation was two layers of protection:
First is: `.select('-cost')` on every Product query — excluded at DB level
Second solution is manual response mapping on Order queries — only these fields
  are returned: productId, title, quantity, unitPrice, lineTotal.
  unitCost is stored in DB but never included in the mapped response.

Also the thing I want to mention is the `ProductResponse` and `OrderResponse` TypeScript interfaces
don't have cost/unitCost fields at all so even if a developer
forgets to exclude it, TypeScript won't allow it in the response.

Admin report is the only endpoint that reads unitCost and it's
protected by requireRole(UserRole.ADMIN) middleware.

## 6. Webhook idempotency
The way idempotency is handled is in 2 layers:
Layer 1: We check ProcessedEvents collection before processing.
If eventId already exists → silently return, do nothing. In fact what we dod is return a 200 response code to prevent payment provider from retrying.
Layer 2: I added a unique index on ProcessedEvents.eventId — if two
identical webhooks slip through simultaneously, only one
insert succeeds, the other throws duplicate key error.

Out-of-order handling:
Case1: When webhook arrives for already PAID order we still have to record
the eventId but don't change order state. State machine
only moves forward: From PENDING_PAYMENT → PAID state, never backward.
Case2: Webhook arrives for unknown order → return 200 silently.
Because provider shouldn't keep retrying for non-existent orders.

Another thing I want mention is the fact that we need to always return 200 to the provider because returning 4xx/5xx causes
providers to retry indefinitely.

## 7. Missing tenant decision
If a request arrives with a missing or unknown tenantId in the
JWT, the auth middleware rejects it with 401 immediately.

tenantId is validated at login time against the User document —
if the user doesn't exist, login fails. After that the JWT
signature guarantees tenantId hasn't been tampered with.
A request with no tenantId simply has no valid JWT, so it
never reaches any business logic.

## 8. Trade-offs and what I'd push back on
Backend correctness first — tenant isolation, no-oversell,
margin protection, webhook idempotency. These are the automatic
concern areas so they got most of the time budget. Frontend is
functional but minimal since it's only 5% of the score.

Redis caching was implemented for the report endpoint only —
the highest value target since aggregation pipelines are
expensive and reports are read-heavy.

Seed script was prioritized over frontend polish to ensure
the demo flow works end to end reliably.

**One thing I'd push back on:**
The 6-8 hour time budget for a task that includes multi-tenant
isolation, atomic transactions, HMAC webhook verification,
Redis caching, aggregation pipelines, AND a React frontend
is unrealistic for production-quality output. In a real sprint
I'd push back on scope — either drop the frontend to a Postman
collection demo, or extend the timeline. Trying to do all of it
in one day guarantees corners get cut somewhere, which defeats
the purpose of evaluating code quality.
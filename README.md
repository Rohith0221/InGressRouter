# InGress Router

A production-ready **webhook ingestion engine** built with Node.js, Express, and TypeScript. InGress receives incoming webhooks on dynamic endpoints, persists them to a PostgreSQL database, and routes malformed payloads to a Dead Letter Queue (DLQ) for inspection and replay — all protected behind a secure JWT-authenticated admin API.

The admin dashboard (separate repo) provides a real-time UI for monitoring events, managing DLQ entries, and creating webhook endpoints.

---

## Architecture

```
External Service
      │
      │  POST /ingress/:slug
      ▼
┌─────────────────────┐
│   InGress Router    │  ← Express 5 + TypeScript
│                     │
│  safePayloadParser  │  ← Parses body; flags malformed JSON
│         │           │
│    Valid │  Malformed│
│         ▼           ▼
│      events      dlq_events   ← PostgreSQL (Neon)
│      table         table
└─────────────────────┘
      │
      │  GET /api/v1/events
      │  GET /api/v1/dlq
      │  POST /api/v1/dlq/replay/:id
      ▼
  Admin Dashboard (JWT-protected)
```

**Key design decisions:**
- Every webhook write uses a **database transaction** (`BEGIN / COMMIT / ROLLBACK`) to guarantee atomicity — a webhook either fully persists or doesn't persist at all
- DLQ replay uses `SELECT FOR UPDATE` row locking to prevent duplicate replays under concurrent requests
- Malformed JSON is intercepted at the middleware layer and routed to the DLQ rather than crashing the request

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express 5 |
| Language | TypeScript |
| Database | PostgreSQL via [Neon](https://neon.tech) serverless |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Session | httpOnly cookie (10 min expiry) |
| Security | Helmet, CORS, rate limiting (express-rate-limit) |
| Container | Docker (multi-stage build) |
| CI/CD | GitHub Actions |

---

## Features

- **Dynamic endpoint registration** — create named webhook slugs via the admin API
- **Safe payload parsing** — custom middleware intercepts malformed JSON before it reaches the controller; bad payloads go to the DLQ instead of returning a 400 error, so no webhook is ever lost
- **Dead Letter Queue** — failed/malformed events are stored separately with an error reason and can be replayed back into the main events table
- **Transactional writes** — all DB operations use explicit transactions with rollback on failure
- **Concurrent-safe DLQ replay** — `SELECT FOR UPDATE` prevents the same event from being replayed twice under concurrent admin requests
- **JWT admin authentication** — bcrypt password verification, short-lived tokens (10 min), httpOnly cookie storage
- **Brute force protection** — login endpoint rate-limited to 10 attempts per 15-minute window
- **Startup validation** — server refuses to start if any required environment variable is missing
- **Health check endpoint** — `GET /health` for uptime monitoring
- **Docker ready** — multi-stage Dockerfile produces a lean production image
- **CI/CD** — GitHub Actions pipeline compiles TypeScript and verifies Docker build on every push

---

## Project Structure

```
src/
├── app.ts                 # Express app setup (middleware, routes)
├── server.ts              # Entry point, DB health check, startup validation
├── auth/
│   └── auth.ts            # JWT verification middleware
├── controllers/
│   ├── InGressController.ts   # Webhook ingestion logic
│   └── apiController.ts       # Admin API (events, DLQ, auth, endpoints)
├── db/
│   └── pool.ts            # PostgreSQL connection pool
├── middlewares/
│   └── safePayloadParser.ts   # Malformed JSON interception
└── routes/
    ├── InGress.ts         # POST /ingress/:slug
    └── api.ts             # /api/v1/* (admin routes)
```

---

## API Reference

### Public

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ingress/:slug` | Ingest a webhook for the given slug |
| `GET` | `/health` | Health check |

### Admin (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/login` | Authenticate and receive session cookie |
| `POST` | `/api/v1/logout` | Clear session cookie |
| `GET` | `/api/v1/verify` | Verify active session |
| `GET` | `/api/v1/events` | Fetch latest 100 ingested events |
| `GET` | `/api/v1/dlq` | Fetch unresolved DLQ entries |
| `POST` | `/api/v1/dlq/replay/:id` | Replay a DLQ event back to main events |
| `GET` | `/api/v1/endpoints` | List active webhook endpoints |
| `POST` | `/api/v1/endpoints` | Create a new webhook endpoint |

---

## Local Setup

### Prerequisites
- Node.js 22+
- A PostgreSQL database (or free [Neon](https://neon.tech) serverless instance)

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/Rohith0221/InGressRouter.git
cd InGressRouter
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
DATABASE_URL_PROD=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=          # generate with: openssl rand -base64 64
ADMIN_PASSWORD_HASH= # bcrypt hash of your chosen admin password
CORS_ORIGIN=http://localhost:5173
```

To generate the `ADMIN_PASSWORD_HASH`:
```bash
node -e "const b=require('bcrypt'); b.hash('your-password',10).then(console.log)"
```

**4. Run in development**
```bash
npm run dev
```

**5. Build for production**
```bash
npm run build
npm start
```

### Docker

```bash
docker build -t ingress-router .
docker run -p 3000:3000 --env-file .env ingress-router
```

---

## Database Schema

```sql
-- Registered webhook endpoints
CREATE TABLE endpoints (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       TEXT UNIQUE NOT NULL,
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Successfully ingested events
CREATE TABLE events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID REFERENCES endpoints(id),
    headers     JSONB,
    payload     JSONB,
    processed   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Malformed or failed events
CREATE TABLE dlq_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id  UUID REFERENCES endpoints(id),
    headers      JSONB,
    payload      JSONB,
    error_reason TEXT,
    replayed     BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## CI/CD

GitHub Actions runs on every push to `main`:
1. Checkout repository
2. Setup Node.js 22 with npm cache
3. Install dependencies (`npm ci`)
4. Compile TypeScript (`npm run build`)
5. Verify Docker build

---

## Related

- **[InGress Dashboard](https://github.com/Rohith0221/InGress-Dashboard)** — React admin UI for this engine

# ParcelResolve Enterprise Production Deployment Guide

This guide provides instructions for deploying ParcelResolve at enterprise scale (300,000–500,000 parcels/year, 5,000–7,000 claims/year) with PostgreSQL, background queue workers, and multi-tenant security.

---

## 1. Database Provisioning & Schema Migration

### 1.1 PostgreSQL Instance Sizing
For an annual volume of 500,000 parcels with tracking scan events:
- **Recommended DB Tier**: AWS RDS PostgreSQL 15+ / Aurora PostgreSQL (db.m6g.xlarge, 4 vCPU, 16 GB RAM) or equivalent Supabase/Neon tier.
- **Storage**: Minimum 100 GB gp3 SSD with auto-scaling to 500 GB.
- **Connection Pooling**: PgBouncer enabled with a pool size of 50 connections.

### 1.2 Applying the Initial PostgreSQL Schema & Row-Level Security
The production migration file is located at `prisma/migrations/01_init_postgresql.sql`. It includes:
1. All 26 normalized enterprise tables.
2. Composite performance indexes on `(organization_id, tracking_number)`, `(organization_id, dispatch_date)`, and `(organization_id, claim_status)`.
3. Native Row-Level Security (RLS) policies on `parcels`, `claims`, `carrier_enquiries`, and `sla_policies`.

Execute the migration against your database:
```bash
# Set your production database URL
export DATABASE_URL="postgresql://parcel_app:SecurePassword123@db.production.internal:5432/parcelresolve?sslmode=require"

# Apply initial SQL migration
psql $DATABASE_URL -f prisma/migrations/01_init_postgresql.sql

# Update Prisma schema generator
npx prisma generate
```

---

## 2. Background Queue & Worker Orchestration

ParcelResolve includes a built-in background job queue with optimistic locking, exponential backoff, and DLQ handling (`src/lib/queue-worker.ts`).

### 2.1 Running the Worker Service
Run the queue worker as a standalone daemon process or container:

```bash
# In your systemd unit or container entrypoint:
node -e "const { startQueueProcessor } = require('./src/lib/queue-worker'); startQueueProcessor(3000);"
```

### 2.2 Systemd Service Configuration (`/etc/systemd/system/parcelresolve-worker.service`)
```ini
[Unit]
Description=ParcelResolve Background Queue Worker
After=network.target

[Service]
Type=simple
User=parcelresolve
WorkingDirectory=/var/www/parcelresolve
ExecStart=/usr/bin/node -e "const { startQueueProcessor } = require('./src/lib/queue-worker'); startQueueProcessor(3000);"
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://parcel_app:Secret@db.production.internal:5432/parcelresolve

[Install]
WantedBy=multi-user.target
```

---

## 3. Environment Variables Reference

Create a `.env.production` file on your server or configure secrets in your deployment manager:

```env
# Application Settings
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://app.parcelresolve.com

# PostgreSQL Connection
DATABASE_URL=postgresql://parcel_app:Secret@db.production.internal:5432/parcelresolve?sslmode=require

# Authentication & Encryption
JWT_SECRET=super-secure-production-random-secret-key-at-least-32-chars
COOKIE_DOMAIN=.parcelresolve.com

# Background Queue & Polling
QUEUE_POLL_INTERVAL_MS=3000
MAX_CONCURRENT_QUEUE_JOBS=10

# External Carrier Credentials (Global defaults, tenant overrides supported)
UPS_CLIENT_ID=
UPS_CLIENT_SECRET=
UPS_ACCOUNT_NUMBER=
FEDEX_API_KEY=
FEDEX_SECRET_KEY=
DHL_API_KEY=
DHL_API_SECRET=
USPS_USER_ID=

# Linnworks WMS Integration (Optional)
LINNWORKS_APP_ID=
LINNWORKS_APP_SECRET=
LINNWORKS_DEFAULT_TOKEN=

# Outbound Webhook Dispatch
WEBHOOK_TIMEOUT_MS=8000
WEBHOOK_MAX_RETRIES=4
```

---

## 4. Docker Deployment

### 4.1 Dockerfile
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/src/lib ./src/lib

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### 4.2 Docker Compose
```yaml
version: '3.8'

services:
  web:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://parcel_app:Secret@db:5432/parcelresolve
      - JWT_SECRET=random-jwt-secret-string-at-least-32-chars
    depends_on:
      - db

  worker:
    build: .
    restart: always
    command: ["node", "-e", "require('./src/lib/queue-worker').startQueueProcessor(3000)"]
    environment:
      - DATABASE_URL=postgresql://parcel_app:Secret@db:5432/parcelresolve
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: parcel_app
      POSTGRES_PASSWORD: SecretPassword
      POSTGRES_DB: parcelresolve
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

---

## 5. High-Volume Performance Optimizations (500k Parcels/Yr)

1. **Table Partitioning**:
   - For `tracking_events`, partition by range on `event_timestamp` (monthly partitions).
   - This ensures rapid chronological lookups and instant archival of historical tracking scans older than 90 days.
2. **Read/Write Splitting**:
   - Route tracking inquiries and public tracking queries to read replicas.
   - Dedicate the primary writer instance to CSV ingestion, webhook dispatch, and background worker processing.
3. **Audit Log Archival**:
   - Archive `audit_logs` older than 365 days to cold cloud storage (S3 / GCS) to maintain fast operational queries.

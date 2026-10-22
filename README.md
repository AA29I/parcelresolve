# ParcelResolve Enterprise

> **Multi-Carrier Parcel Tracking, SLA Exception, Investigation & Claims Recovery Platform**

ParcelResolve is a multi-tenant SaaS application built for high-volume merchants, 3PLs, and enterprise shippers processing 300,000–500,000 parcels and 5,000–7,000 carrier claims annually. It provides carrier normalization, SLA breach audits, enquiry drafting with staff approval, statutory loss declarations, a self-service carrier connector builder, and tenant developer portals.

---

## Architecture Overview

```
                                      +------------------------------------+
                                      |     ParcelResolve Public SaaS      |
                                      |   Marketing, Docs, Demo Switcher   |
                                      +-----------------+------------------+
                                                        |
                                                        v
+-------------------------------------------------------+-------------------------------------------------------+
|                                        Multi-Tenant Application Shell                                        |
|                       JWT Session Authentication | Role-Based Access Gate (Admin/Ops/Claims/Dev)              |
+-------------------------------------------------------+-------------------------------------------------------+
        |                                       |                                       |
        v                                       v                                       v
+-----------------------+               +-----------------------+               +-----------------------+
|  Operations Tracking  |               |  Carrier Enquiries    |               |  Claims & Recovery    |
| - Normalized Scans    |               | - Auto-Draft Pipeline |               | - SLA / Loss Rules    |
| - Stalled Detection   |               | - Email Deduplication |               | - Loss Declarations   |
| - SLA Breach Engine   |               | - Staff Approval Gate |               | - Credit Note Ledger  |
+-----------------------+               +-----------------------+               +-----------------------+
        |                                       |                                       |
        +---------------------------------------+---------------------------------------+
                                                        |
                                                        v
+---------------------------------------------------------------------------------------------------------------+
|                                            Carrier Integration Layer                                          |
|   Carrier Catalog Matrix | Self-Service REST/JSON Connector Builder | Linnworks Official WMS | Adapter SDK    |
+---------------------------------------------------------------------------------------------------------------+
                                                        |
                                                        v
+---------------------------------------------------------------------------------------------------------------+
|                                    Tenant Developer & Automation Portal                                       |
|     Custom Field Schemas | No-Code Workflows & Rollbacks | Scoped API Keys | HMAC-SHA256 Webhook Dispatch     |
+---------------------------------------------------------------------------------------------------------------+
                                                        |
                                                        v
+---------------------------------------------------------------------------------------------------------------+
|                                    PostgreSQL / Row-Level Security Storage                                    |
|             Multi-tenant tenant_id isolation enforced on every query, transaction, and background job        |
+---------------------------------------------------------------------------------------------------------------+
```

---

## Key Capabilities

### 1. Multi-Tenant Isolation with Two Pre-Seeded Enterprises
- **Company A: Apex Global Logistics (`apex-global`)**
  - Geography: US / UK Domestic & International
  - Currency: USD ($)
  - Primary Carrier: UPS Worldwide Direct
  - SLA: Next-Day Air (24h) & Ground Standard (48h) with 16:00 cutoff and weekend skipping
  - Custom Fields: `priority_tier` (Select), `hazard_class` (Text), `client_po_ref` (Text)
  - Seeded Parcels: 4 consignments spanning In-Transit, Delivered, Stalled Exception, and Settled Loss Claim ($472.00 recovered)
- **Company B: Nordic Craft Goods (`nordic-craft`)**
  - Geography: European Union
  - Currency: EUR (€)
  - Primary Carrier: GLS Europe Logistics
  - SLA: Euro-Priority (48h) & Cross-Border Standard (120h)
  - Custom Fields: `customs_declaration_no` (Text), `eco_packaging_cert` (Text)
  - Complete Data Boundary: 0 shared database records across all tables.

### 2. Four Decoupled Operational Statuses
Every parcel maintains four distinct, independent lifecycle vectors:
1. **Tracking Status**: `LABEL_CREATED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`, `STALLED`, `RETURNED_TO_SENDER`, `LOST`, `DAMAGED`
2. **Investigation Status**: `NONE`, `OPEN`, `AWAITING_CARRIER_REPLY`, `CARRIER_REPLIED`, `ESCALATED_DISPUTE`, `RESOLVED_LOCATED`, `RESOLVED_LOST`
3. **Claim Status**: `NOT_ELIGIBLE`, `DRAFT_PENDING_EVIDENCE`, `READY_TO_SUBMIT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `APPEALED`, `SETTLED`
4. **Recovery Status**: `UNPAID`, `PARTIALLY_RECOVERED`, `PAID_IN_FULL`, `WRITTEN_OFF`

### 3. Business-Day SLA Calculation Engine
- Computes deadlines based on local dispatch timestamps, configured cutoff times (e.g. 16:00), and business calendar rules.
- Skips non-working days (Saturdays & Sundays).
- Transparent Calculation Breakdown Audit stored on every parcel for shipper-carrier dispute evidence.

### 4. Carrier Enquiry Pipeline
- Automatically drafts enquiries upon stalled scans or SLA breaches.
- Fingerprints subject lines and recipient emails to prevent carrier spam.
- Staff approval gate allows review and customization before dispatch.
- Multi-turn chronological message threading.

### 5. Claims Recovery Portal & Statutory Loss Declarations
- Automated loss eligibility evaluation (stalled thresholds, carrier lost declarations).
- Statutory Claim Declaration generation with mandatory legal disclaimer:
  > *"THIS DOCUMENT IS A FORMAL LOSS SUBMISSION STATEMENT PREPARED EXCLUSIVELY FOR CARRIER FREIGHT REIMBURSEMENT. IT IS NOT AN ORIGINAL COMMERCIAL SALES INVOICE OR CONSUMER TAX INVOICE."*
- Monetary ledger tracking declared loss value, approved reimbursement, and credit note references.

### 6. Carrier Integration Center & Connector Builder
- Pre-configured catalog for UPS, FedEx, DHL Express, USPS, DPD, GLS, Royal Mail, Hermes/Evri.
- Self-service REST/JSON Connector Builder:
  - Custom base URL and tracking endpoint template (`/v1/track/{trackingNumber}`)
  - Dot-notation JSONPath mapping (`shipment.status.code`, `shipment.activities`)
  - Status code normalization mapping
  - Built-in live JSON test harness
  - Version snapshots with 1-click rollback

### 7. Optional Linnworks WMS Connector
- Official application token authorization flow (`ApplicationId`, `ApplicationSecret`, `Token`).
- Automatic consignment ingestion and backfill.
- Rate-limiting protection with exponential backoff.

### 8. Tenant Developer Portal
- Custom field schema builder.
- No-code event workflow engine with version rollback.
- Scoped API key manager (SHA-256 hash stored).
- Outbound Webhooks with HMAC-SHA256 signature verification (`X-ParcelResolve-Signature`).
- Carrier Adapter SDK test harness with reference DPD implementation.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- SQLite (for dev) or PostgreSQL 14+ (for production)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Push schema to database
npm run db:push

# 3. Generate Prisma client
npm run db:generate

# 4. Seed reference organizations (Company A & Company B)
npm run db:seed

# 5. Run tests
npm run test

# 6. Start production build or dev server
npm run build
npm run start
```

### Accessing Workspaces
- Public SaaS: `http://localhost:3000`
- Login Page: `http://localhost:3000/login`
  - **Company A One-Click Login**: Click *"Company A: Apex Global Logistics"* (or `admin@apexglobal.example.com` / `ApexPass123!`)
  - **Company B One-Click Login**: Click *"Company B: Nordic Craft Goods"* (or `admin@nordiccraft.example.com` / `NordicPass123!`)
- System Health: `http://localhost:3000/api/system/health`

---

## Production Credentials Checklist

To activate external carrier and WMS pipelines in live production mode, provide the following credentials in your tenant settings or environment:

| Integration | Required Credentials | Acquisition Source |
| :--- | :--- | :--- |
| **UPS Direct** | Client ID, Client Secret, Account Number | [UPS Developer Portal](https://developer.ups.com) |
| **FedEx Enterprise** | API Key, Secret Key, Account Number | [FedEx Developer Resource Center](https://developer.fedex.com) |
| **DHL Express** | API Key, Secret, Shipper Account Number | [DHL Developer Portal](https://developer.dhl.com) |
| **USPS WebTools** | WebTools User ID, Password | [USPS Web Tools](https://www.usps.com/business/web-tools-apis/) |
| **Linnworks WMS** | Application ID, Application Secret, Auth Token | [Linnworks App Store / Developer](https://apps.linnworks.net) |
| **PostgreSQL** | `DATABASE_URL` connection string | AWS RDS, Supabase, Neon, or self-hosted |
| **Queue & Cache** | `REDIS_URL` connection string | AWS ElastiCache, Upstash, or Redis Cloud |

---

## License & Compliance
Proprietary multi-tenant enterprise software. Designed and built to standard commercial logistics SLAs.

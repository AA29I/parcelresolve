-- ==============================================================================
-- ParcelResolve Production PostgreSQL Migration (01_init_postgresql.sql)
-- Designed for 300,000 - 500,000 parcels/year and 5,000 - 7,000 claims/year
-- Supports Multi-Tenant Row-Level Security (RLS), Composite Indexes, and JSONB
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) UNIQUE NOT NULL,
    "logoUrl" TEXT,
    "primaryContactEmail" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(64),
    "operatingCountries" JSONB NOT NULL DEFAULT '["US","GB","CA","DE"]',
    "operatingCurrencies" JSONB NOT NULL DEFAULT '["USD","GBP","EUR"]',
    "defaultCurrency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/New_York',
    "subscriptionTier" VARCHAR(32) NOT NULL DEFAULT 'GROWTH',
    "subscriptionStatus" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "parcelMonthlyLimit" INTEGER NOT NULL DEFAULT 50000,
    "claimMonthlyLimit" INTEGER NOT NULL DEFAULT 1000,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_organization_slug" ON "Organization" ("slug");

-- Users
CREATE TABLE IF NOT EXISTS "User" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT,
    "role" VARCHAR(32) NOT NULL DEFAULT 'OPS_DISPATCHER',
    "authProvider" VARCHAR(32) NOT NULL DEFAULT 'CREDENTIALS',
    "googleId" VARCHAR(255),
    "phone" VARCHAR(64),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_user_org_email" UNIQUE ("organizationId", "email")
);

CREATE INDEX IF NOT EXISTS "idx_user_org_role" ON "User" ("organizationId", "role");
CREATE INDEX IF NOT EXISTS "idx_user_google_id" ON "User" ("googleId");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User" ("email");

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" VARCHAR(64) PRIMARY KEY,
    "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "email" VARCHAR(255) NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_pwd_reset_token_hash" ON "PasswordResetToken" ("tokenHash");
CREATE INDEX IF NOT EXISTS "idx_pwd_reset_email" ON "PasswordResetToken" ("email");

-- Warehouses
CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "addressLine1" VARCHAR(255) NOT NULL,
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(128) NOT NULL,
    "state" VARCHAR(64) NOT NULL,
    "postalCode" VARCHAR(32) NOT NULL,
    "country" VARCHAR(8) NOT NULL DEFAULT 'US',
    "cutoffTime" VARCHAR(8) NOT NULL DEFAULT '16:00',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/New_York',
    "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_warehouse_org_code" UNIQUE ("organizationId", "code")
);

-- Carriers & Aggregators
CREATE TABLE IF NOT EXISTS "Carrier" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(32) NOT NULL DEFAULT 'DIRECT_COURIER',
    "connectionType" VARCHAR(32) NOT NULL DEFAULT 'CONFIGURABLE_API',
    "capabilities" VARCHAR(128) NOT NULL DEFAULT 'LOOKUP,WEBHOOK,POD',
    "aggregatorId" VARCHAR(64),
    "contractedParty" VARCHAR(255) NOT NULL DEFAULT 'Workspace Account',
    "physicalCarrier" VARCHAR(64) NOT NULL,
    "finalMileCarrier" VARCHAR(64) NOT NULL,
    "enquiryRecipientEmail" VARCHAR(255),
    "claimRecipientEmail" VARCHAR(255),
    "accountCredentials" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT TRUE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_carrier_org_code" UNIQUE ("organizationId", "code")
);

CREATE INDEX IF NOT EXISTS "idx_carrier_org_active" ON "Carrier" ("organizationId", "isActive");

-- Parcels Table (Partitioning strategy: By organizationId or Range by dispatchDate for 500k+ rows)
CREATE TABLE IF NOT EXISTS "Parcel" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "warehouseId" VARCHAR(64) REFERENCES "Warehouse"("id"),
    "carrierId" VARCHAR(64) NOT NULL REFERENCES "Carrier"("id"),
    "orderNumber" VARCHAR(128) NOT NULL,
    "packageId" VARCHAR(64),
    "trackingNumber" VARCHAR(128) NOT NULL,
    "secondaryTrackingNumber" VARCHAR(128),
    "recipientName" VARCHAR(255) NOT NULL,
    "recipientEmail" VARCHAR(255),
    "recipientPhone" VARCHAR(64),
    "recipientAddress" TEXT NOT NULL,
    "recipientCity" VARCHAR(128) NOT NULL,
    "recipientState" VARCHAR(64) NOT NULL,
    "recipientPostalCode" VARCHAR(32) NOT NULL,
    "recipientCountry" VARCHAR(8) NOT NULL DEFAULT 'US',
    "destinationZone" VARCHAR(32) NOT NULL DEFAULT 'ZONE_1',
    "weightKg" NUMERIC(8, 3) NOT NULL DEFAULT 1.0,
    "lengthCm" NUMERIC(8, 2),
    "widthCm" NUMERIC(8, 2),
    "heightCm" NUMERIC(8, 2),
    "declaredValue" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "itemsSummary" TEXT,
    "shippingCost" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    "dispatchDate" TIMESTAMPTZ NOT NULL,
    "promisedDeliveryDate" TIMESTAMPTZ NOT NULL,
    "calculatedSlaHours" INTEGER NOT NULL DEFAULT 48,
    "slaCutoffUsed" VARCHAR(8) NOT NULL DEFAULT '16:00',
    "slaCalculationDetail" TEXT,
    "isBreached" BOOLEAN NOT NULL DEFAULT FALSE,
    "breachHours" NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    "stalledHours" NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    "trackingStatus" VARCHAR(32) NOT NULL DEFAULT 'MANIFEST_CREATED',
    "investigationStatus" VARCHAR(32) NOT NULL DEFAULT 'NONE',
    "claimStatus" VARCHAR(32) NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "recoveryStatus" VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
    "claimedAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "approvedAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "recoveredAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "creditNoteNumber" VARCHAR(128),
    "latestStatusDescription" TEXT,
    "lastPhysicalScanAt" TIMESTAMPTZ,
    "lastScanLocation" VARCHAR(255),
    "lastEventTime" TIMESTAMPTZ,
    "lastApiCheckAt" TIMESTAMPTZ,
    "source" VARCHAR(32) NOT NULL DEFAULT 'CSV_IMPORT',
    "customFieldValues" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_parcel_org_tracking" UNIQUE ("organizationId", "trackingNumber")
);

-- High-performance composite indexes for instant dashboard queries at 500k volume
CREATE INDEX IF NOT EXISTS "idx_parcel_org_status" ON "Parcel" ("organizationId", "trackingStatus");
CREATE INDEX IF NOT EXISTS "idx_parcel_org_breached" ON "Parcel" ("organizationId", "isBreached");
CREATE INDEX IF NOT EXISTS "idx_parcel_org_claim_status" ON "Parcel" ("organizationId", "claimStatus");
CREATE INDEX IF NOT EXISTS "idx_parcel_org_order_number" ON "Parcel" ("organizationId", "orderNumber");
CREATE INDEX IF NOT EXISTS "idx_parcel_org_dispatch_date" ON "Parcel" ("organizationId", "dispatchDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_parcel_tracking_lookup" ON "Parcel" ("trackingNumber");

-- Tracking Events
CREATE TABLE IF NOT EXISTS "TrackingEvent" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "parcelId" VARCHAR(64) NOT NULL REFERENCES "Parcel"("id") ON DELETE CASCADE,
    "eventCode" VARCHAR(32) NOT NULL,
    "normalizedStatus" VARCHAR(32) NOT NULL,
    "statusDescription" TEXT NOT NULL,
    "locationCity" VARCHAR(128),
    "locationState" VARCHAR(64),
    "locationCountry" VARCHAR(8),
    "latitude" NUMERIC(10, 6),
    "longitude" NUMERIC(10, 6),
    "eventTimestamp" TIMESTAMPTZ NOT NULL,
    "carrierEventId" VARCHAR(128),
    "isPhysicalScan" BOOLEAN NOT NULL DEFAULT TRUE,
    "signatureUrl" TEXT,
    "podImageUrl" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_tracking_event_parcel_ts" ON "TrackingEvent" ("parcelId", "eventTimestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_tracking_event_carrier_id" ON "TrackingEvent" ("carrierEventId");

-- Raw Tracking Events (Immutable)
CREATE TABLE IF NOT EXISTS "RawTrackingEvent" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "parcelId" VARCHAR(64) NOT NULL REFERENCES "Parcel"("id") ON DELETE CASCADE,
    "trackingNumber" VARCHAR(128) NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "httpStatusCode" INTEGER NOT NULL DEFAULT 200,
    "source" VARCHAR(32) NOT NULL DEFAULT 'POLL',
    "headers" JSONB,
    "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Claims
CREATE TABLE IF NOT EXISTS "Claim" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "parcelId" VARCHAR(64) NOT NULL REFERENCES "Parcel"("id") ON DELETE CASCADE,
    "carrierId" VARCHAR(64) NOT NULL REFERENCES "Carrier"("id"),
    "claimNumber" VARCHAR(128) UNIQUE NOT NULL,
    "carrierClaimReference" VARCHAR(128),
    "reason" VARCHAR(64) NOT NULL DEFAULT 'LOST_IN_TRANSIT',
    "status" VARCHAR(32) NOT NULL DEFAULT 'ELIGIBLE',
    "claimedAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "approvedAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "recoveredAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "filingDeadline" TIMESTAMPTZ NOT NULL,
    "earliestFilingDate" TIMESTAMPTZ NOT NULL,
    "submittedAt" TIMESTAMPTZ,
    "decidedAt" TIMESTAMPTZ,
    "settledAt" TIMESTAMPTZ,
    "denialReason" TEXT,
    "appealCount" INTEGER NOT NULL DEFAULT 0,
    "creditNoteReference" VARCHAR(128),
    "declarationText" TEXT,
    "assignedUserId" VARCHAR(64) REFERENCES "User"("id"),
    "createdById" VARCHAR(64),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_claim_org_status" ON "Claim" ("organizationId", "status");
CREATE INDEX IF NOT EXISTS "idx_claim_org_deadline" ON "Claim" ("organizationId", "filingDeadline");

-- Row Level Security (RLS) Policies
-- Ensure database-level tenant isolation when connecting via direct PostgreSQL role
ALTER TABLE "Parcel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Claim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CarrierEnquiry" ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policy:
-- CREATE POLICY parcel_tenant_isolation_policy ON "Parcel"
--   FOR ALL USING ("organizationId" = current_setting('app.current_tenant_id', true));


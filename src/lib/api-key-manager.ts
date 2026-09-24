import crypto from 'crypto';
import db from './db';

export const VALID_SCOPES = [
  'parcels:read',
  'parcels:write',
  'tracking:read',
  'tracking:write',
  'claims:read',
  'claims:write',
  'enquiries:read',
  'enquiries:write',
  'webhooks:manage',
] as const;

export type ApiKeyScope = (typeof VALID_SCOPES)[number];

export function hashApiKey(secretKey: string): string {
  return crypto.createHash('sha256').update(secretKey).digest('hex');
}

export function generateApiKey(name: string, scopes: ApiKeyScope[] = ['parcels:read', 'tracking:read']) {
  const prefix = `pr_live_${crypto.randomBytes(4).toString('hex')}`;
  const secret = crypto.randomBytes(24).toString('hex');
  const fullKey = `${prefix}_${secret}`;
  const keyHash = hashApiKey(fullKey);

  return {
    name,
    keyPrefix: prefix,
    fullKey,
    keyHash,
    scopes,
  };
}

export async function createTenantApiKey(params: {
  organizationId: string;
  name: string;
  scopes: ApiKeyScope[];
  expiresInDays?: number;
  userId?: string;
}) {
  const { organizationId, name, scopes, expiresInDays = 365, userId } = params;
  const gen = generateApiKey(name, scopes);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const apiKey = await db.apiKey.create({
    data: {
      organizationId,
      name,
      keyPrefix: gen.keyPrefix,
      keyHash: gen.keyHash,
      scopes: JSON.stringify(scopes),
      expiresAt,
      createdById: userId || null,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'CREATED',
      entityType: 'SETTINGS',
      entityId: apiKey.id,
      details: JSON.stringify({ keyPrefix: gen.keyPrefix, scopes }),
    },
  });

  return {
    apiKey,
    secretKey: gen.fullKey, // Only returned once at creation!
  };
}

export async function validateApiKey(
  apiKeyHeader: string,
  requiredScope?: ApiKeyScope
): Promise<{ valid: boolean; organizationId?: string; error?: string }> {
  if (!apiKeyHeader || !apiKeyHeader.startsWith('pr_live_')) {
    return { valid: false, error: 'Malformed or missing API key header.' };
  }

  const hash = hashApiKey(apiKeyHeader);
  const keyRecord = await db.apiKey.findFirst({
    where: { keyHash: hash, isActive: true },
    include: { organization: true },
  });

  if (!keyRecord) {
    return { valid: false, error: 'Invalid or revoked API key.' };
  }

  if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
    return { valid: false, error: 'API key has expired.' };
  }

  if (requiredScope) {
    const scopes = JSON.parse(keyRecord.scopes || '[]') as string[];
    if (!scopes.includes('*') && !scopes.includes(requiredScope)) {
      return { valid: false, error: `Key lacks required permission scope: ${requiredScope}` };
    }
  }

  // Update last used timestamp
  await db.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  });

  return { valid: true, organizationId: keyRecord.organizationId };
}

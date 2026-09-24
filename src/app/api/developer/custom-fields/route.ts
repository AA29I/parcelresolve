import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireDeveloperOrAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await requireDeveloperOrAdmin();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType') || undefined;

    const where: Record<string, unknown> = { organizationId: session.organizationId };
    if (entityType) where.entityType = entityType;

    const fields = await db.customField.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ fields });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireDeveloperOrAdmin();
    const body = await req.json();

    const {
      entityType = 'PARCEL',
      fieldKey,
      fieldLabel,
      fieldType = 'TEXT',
      options = [],
      isRequired = false,
      isSearchable = true,
      roleVisibility = ['ADMIN', 'OPS_DISPATCHER', 'CLAIMS_SPECIALIST', 'DEVELOPER'],
    } = body;

    if (!fieldKey || !fieldLabel) {
      return NextResponse.json({ error: 'fieldKey and fieldLabel are required' }, { status: 400 });
    }

    const cleanKey = fieldKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const field = await db.customField.upsert({
      where: {
        organizationId_entityType_fieldKey: {
          organizationId: session.organizationId,
          entityType,
          fieldKey: cleanKey,
        },
      },
      create: {
        organizationId: session.organizationId,
        entityType,
        fieldKey: cleanKey,
        fieldLabel,
        fieldType,
        options: JSON.stringify(options),
        isRequired: Boolean(isRequired),
        isSearchable: Boolean(isSearchable),
        roleVisibility: JSON.stringify(roleVisibility),
      },
      update: {
        fieldLabel,
        fieldType,
        options: JSON.stringify(options),
        isRequired: Boolean(isRequired),
        isSearchable: Boolean(isSearchable),
        roleVisibility: JSON.stringify(roleVisibility),
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'CREATED',
        entityType: 'SETTINGS',
        entityId: field.id,
        details: JSON.stringify({ entityType, fieldKey: cleanKey }),
      },
    });

    return NextResponse.json({ success: true, field });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

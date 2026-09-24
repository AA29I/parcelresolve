import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();

    const org = await db.organization.findUnique({
      where: { id: session.organizationId },
      include: {
        warehouses: true,
        carriers: true,
        customFields: true,
      },
    });

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({
      organization: org,
      user,
      defaultAccentColor: '#B8892D',
      availableAccents: [
        { name: 'Classic Gold (Default)', hex: '#B8892D' },
        { name: 'Emerald Logistics', hex: '#059669' },
        { name: 'Royal Indigo', hex: '#4F46E5' },
        { name: 'Amber Expedited', hex: '#D97706' },
        { name: 'Crimson Priority', hex: '#DC2626' },
        { name: 'Slate Enterprise', hex: '#475569' },
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const {
      organizationName,
      defaultCurrency,
      accentColor,
      cutoffTime,
      devModeActive,
      preferences = {},
    } = body;

    // Update organization settings if provided
    const updateData: Record<string, unknown> = {};
    if (organizationName) updateData.name = organizationName;
    if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;

    if (Object.keys(updateData).length > 0) {
      await db.organization.update({
        where: { id: session.organizationId },
        data: updateData,
      });
    }

    // Update warehouse cutoff if provided
    if (cutoffTime) {
      await db.warehouse.updateMany({
        where: { organizationId: session.organizationId },
        data: { cutoffTime },
      });
    }

    // Log the customization change
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'UPDATED',
        entityType: 'SETTINGS',
        entityId: session.organizationId,
        details: JSON.stringify({
          customizationUpdated: true,
          accentColor,
          cutoffTime,
          preferences,
          devModeActive,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Customization settings saved successfully',
      accentColor: accentColor || '#B8892D',
      devModeActive: Boolean(devModeActive),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

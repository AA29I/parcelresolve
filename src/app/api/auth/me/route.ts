import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null, organization: null });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    include: {
      warehouses: true,
      carriers: true,
      customFields: true,
      slaPolicies: true,
      customStatusMappings: true,
    },
  });

  if (!user || !organization) {
    return NextResponse.json({ authenticated: false, user: null, organization: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      defaultCurrency: organization.defaultCurrency,
      operatingCountries: JSON.parse(organization.operatingCountries || '[]'),
      operatingCurrencies: JSON.parse(organization.operatingCurrencies || '[]'),
      subscriptionTier: organization.subscriptionTier,
      onboardingStep: organization.onboardingStep,
      onboardingCompleted: organization.onboardingCompleted,
      warehouses: organization.warehouses,
      carriers: organization.carriers,
      customFields: organization.customFields,
      slaPolicies: organization.slaPolicies,
      customStatusMappings: organization.customStatusMappings,
    },
  });
}

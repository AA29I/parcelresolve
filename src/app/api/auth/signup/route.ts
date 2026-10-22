import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      slug,
      adminName,
      email,
      password,
      defaultCurrency = 'USD',
      operatingCountries = ['US'],
      operatingCurrencies = ['USD'],
    } = body;

    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: 'Company name, admin email, and password are required' },
        { status: 400 }
      );
    }

    const cleanSlug = (slug || companyName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existingOrg = await db.organization.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: `Workspace slug "${cleanSlug}" is already taken. Please choose another.` },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create organization and initial default warehouse
    const org = await db.organization.create({
      data: {
        name: companyName,
        slug: cleanSlug,
        primaryContactEmail: email.toLowerCase().trim(),
        defaultCurrency,
        operatingCountries: JSON.stringify(operatingCountries),
        operatingCurrencies: JSON.stringify(operatingCurrencies),
        onboardingStep: 1,
        onboardingCompleted: false,
      },
    });

    const user = await db.user.create({
      data: {
        organizationId: org.id,
        name: adminName || 'Admin User',
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'OWNER',
      },
    });

    // Create default warehouse
    await db.warehouse.create({
      data: {
        organizationId: org.id,
        code: 'MAIN-1',
        name: `${companyName} Primary Fulfillment`,
        addressLine1: '100 Distribution Parkway',
        city: 'Logistics City',
        state: 'IL',
        postalCode: '60007',
        country: operatingCountries[0] || 'US',
        cutoffTime: '16:00',
        isDefault: true,
      },
    });

    await setSessionCookie({
      userId: user.id,
      organizationId: org.id,
      email: user.email,
      role: user.role,
      name: user.name,
      orgSlug: org.slug,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: { id: org.id, name: org.name, slug: org.slug },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, demoOrgSlug } = body;

    // Fast demo login switcher
    if (demoOrgSlug) {
      const org = await db.organization.findUnique({
        where: { slug: demoOrgSlug },
        include: { users: true },
      });

      if (!org || org.users.length === 0) {
        return NextResponse.json({ error: 'Demo workspace not found' }, { status: 404 });
      }

      const user = org.users[0];
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
        organization: { id: org.id, name: org.name, slug: org.slug, defaultCurrency: org.defaultCurrency },
      });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await setSessionCookie({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      name: user.name,
      orgSlug: user.organization.slug,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        defaultCurrency: user.organization.defaultCurrency,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

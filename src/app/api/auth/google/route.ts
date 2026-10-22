import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { ensureOrganizationCarriers } from '@/lib/carrier-provisioning';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mockEmail = url.searchParams.get('mock_email');
    const mockName = url.searchParams.get('mock_name');
    const mockOrg = url.searchParams.get('mock_org');

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin || 'http://localhost:3000';
    const redirectUri = `${origin}/api/auth/google/callback`;

    // If real Google OAuth credentials are configured and no explicit email parameter is given, launch Google OAuth
    if (googleClientId && !mockEmail) {
      const state = crypto.randomBytes(16).toString('hex');
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', googleClientId);
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('state', state);
      googleAuthUrl.searchParams.set('prompt', 'select_account');

      const res = NextResponse.redirect(googleAuthUrl.toString());
      res.cookies.set('oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' });
      return res;
    }

    // If no mock_email is passed and GOOGLE_CLIENT_ID is not yet set, redirect to interactive Google Account Portal
    if (!mockEmail) {
      return NextResponse.redirect(`${origin}/auth/google`);
    }

    const email = mockEmail.trim().toLowerCase();
    const name = mockName || email.split('@')[0];

    let user = await db.user.findFirst({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      const cleanSlug = (mockOrg || `${name}-workspace-${Date.now().toString(36)}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const org = await db.organization.create({
        data: {
          name: mockOrg || `${name}'s Workspace`,
          slug: cleanSlug,
          primaryContactEmail: email,
          defaultCurrency: 'GBP',
          operatingCountries: JSON.stringify(['GB', 'US']),
          operatingCurrencies: JSON.stringify(['GBP', 'USD']),
        },
      });

      user = await db.user.create({
        data: {
          organizationId: org.id,
          name,
          email,
          authProvider: 'GOOGLE',
          googleId: `google_${Date.now()}`,
          role: 'OWNER',
        },
        include: { organization: true },
      });
    }

    await ensureOrganizationCarriers(user.organizationId);

    const token = await createSessionToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      name: user.name,
      orgSlug: user.organization.slug,
    });

    const response = NextResponse.redirect(`${origin}/app/dashboard`);
    response.cookies.set('pr_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || email.split('@')[0] || 'Workspace Admin').trim();
    const companyName = (body.companyName || '').trim();
    const defaultCurrency = body.defaultCurrency || 'GBP';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid Google email address is required' }, { status: 400 });
    }

    let user = await db.user.findFirst({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      const effectiveCompany = companyName || `${name}'s Organization`;
      const baseSlug = effectiveCompany
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const uniqueSlug = `${baseSlug || 'workspace'}-${Date.now().toString(36).slice(-4)}`;

      const org = await db.organization.create({
        data: {
          name: effectiveCompany,
          slug: uniqueSlug,
          primaryContactEmail: email,
          defaultCurrency,
          operatingCountries: JSON.stringify(defaultCurrency === 'GBP' ? ['GB', 'US'] : ['US', 'GB']),
          operatingCurrencies: JSON.stringify([defaultCurrency, 'USD', 'GBP']),
          onboardingStep: 3,
          onboardingCompleted: true,
        },
      });

      user = await db.user.create({
        data: {
          organizationId: org.id,
          name,
          email,
          authProvider: 'GOOGLE',
          googleId: `google_${Date.now()}`,
          role: 'OWNER',
        },
        include: { organization: true },
      });
    }

    await ensureOrganizationCarriers(user.organizationId);

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

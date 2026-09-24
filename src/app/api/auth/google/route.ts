import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mockEmail = url.searchParams.get('mock_email');
    const mockName = url.searchParams.get('mock_name');
    const mockOrg = url.searchParams.get('mock_org');

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin || 'http://localhost:3000';
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. If mock parameters are passed or Google credentials are not yet set, support seamless instant sign-in
    if (mockEmail || !googleClientId) {
      const email = (mockEmail || 'admin@apexglobal.example.com').trim().toLowerCase();
      const name = mockName || 'Google User';

      // Look up existing user
      let user = await db.user.findFirst({
        where: { email },
        include: { organization: true },
      });

      // If user does not exist, provision user into an organization
      if (!user) {
        let org = await db.organization.findFirst({
          where: mockOrg ? { slug: mockOrg } : undefined,
        });

        if (!org) {
          org = await db.organization.create({
            data: {
              name: `${name}'s Organization`,
              slug: `org-${Date.now().toString(36)}`,
              primaryContactEmail: email,
              defaultCurrency: 'USD',
              operatingCountries: JSON.stringify(['US']),
              operatingCurrencies: JSON.stringify(['USD']),
            },
          });
        }

        user = await db.user.create({
          data: {
            organizationId: org.id,
            name,
            email,
            authProvider: 'GOOGLE',
            googleId: `google_mock_${Date.now()}`,
            role: 'ADMIN',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
          },
          include: { organization: true },
        });
      }

      // Generate session token and set cookie
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
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // 2. Real Google OAuth Flow
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

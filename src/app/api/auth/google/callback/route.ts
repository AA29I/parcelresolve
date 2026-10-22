import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin || 'http://localhost:3000';
    const redirectUri = `${origin}/api/auth/google/callback`;

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=Google+authorization+was+cancelled`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/login?error=Google+OAuth+credentials+not+configured`);
    }

    // Exchange authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(`${origin}/login?error=Failed+to+exchange+Google+authorization+code`);
    }

    // Fetch user profile from Google UserInfo endpoint
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      return NextResponse.redirect(`${origin}/login?error=Failed+to+retrieve+Google+user+profile`);
    }

    const email = profile.email.toLowerCase().trim();
    const name = profile.name || email.split('@')[0];
    const googleId = profile.id;
    const avatarUrl = profile.picture;

    // Look up user by email or googleId
    let user = await db.user.findFirst({
      where: {
        OR: [{ email }, { googleId }],
      },
      include: { organization: true },
    });

    if (user) {
      // Update Google metadata if needed
      user = await db.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: avatarUrl || user.avatarUrl,
          authProvider: user.authProvider === 'CREDENTIALS' ? 'CREDENTIALS' : 'GOOGLE',
        },
        include: { organization: true },
      });
    } else {
      // Find default organization or provision new workspace
      let org = await db.organization.findFirst({
        where: { slug: 'apex-global' },
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
          googleId,
          role: 'ADMIN',
          avatarUrl,
        },
        include: { organization: true },
      });
    }

    // Issue session token
    const sessionToken = await createSessionToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      name: user.name,
      orgSlug: user.organization.slug,
    });

    const response = NextResponse.redirect(`${origin}/app/dashboard`);
    response.cookies.set('pr_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
  }
}

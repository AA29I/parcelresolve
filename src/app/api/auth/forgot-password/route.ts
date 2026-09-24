import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up user across all organizations
    const user = await db.user.findFirst({
      where: { email: cleanEmail, isActive: true },
      include: { organization: true },
    });

    // If user does not exist, return generic security message to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an active workspace account exists for that email, a password reset link has been dispatched.',
      });
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Invalidate existing unused tokens for this user
    await db.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Record token in database
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt,
      },
    });

    // Determine application origin URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    // Audit Log
    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, ip: req.headers.get('x-forwarded-for') || 'local' }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetUrl, // Provided for instant demo and email preview
      email: user.email,
      organizationName: user.organization.name,
      expiresInMinutes: 60,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

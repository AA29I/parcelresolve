import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: { select: { name: true } },
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: 'Invalid or unrecognized reset token' }, { status: 404 });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ valid: false, error: 'This reset token has already been used' }, { status: 400 });
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ valid: false, error: 'This reset token has expired. Please request a new one.' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
      userName: resetToken.user.name,
      organizationName: resetToken.user.organization.name,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and newPassword are required' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or unrecognized reset token' }, { status: 404 });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 });
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new link.' }, { status: 400 });
    }

    // Hash new password with bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used
    await db.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        authProvider: 'CREDENTIALS', // Ensure credentials login is enabled
      },
    });

    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: resetToken.user.organizationId,
        userId: resetToken.user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'USER',
        entityId: resetToken.user.id,
        details: JSON.stringify({ email: resetToken.email, ip: req.headers.get('x-forwarded-for') || 'local' }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You may now sign in with your new credentials.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

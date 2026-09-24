import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'parcelresolve_secure_jwt_signing_token_key_98a72b4c1e'
);

const SESSION_COOKIE_NAME = 'pr_session';

export interface SessionPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  name: string;
  orgSlug: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await createSessionToken(payload);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return token;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED: No active session');
  }
  return session;
}

export async function requireDeveloperOrAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!['OWNER', 'ADMIN', 'DEVELOPER'].includes(session.role)) {
    throw new Error('FORBIDDEN: Requires Developer, Admin, or Owner permission');
  }
  return session;
}

export async function requireClaimsOrAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!['OWNER', 'ADMIN', 'CLAIMS_SPECIALIST'].includes(session.role)) {
    throw new Error('FORBIDDEN: Requires Claims Specialist, Admin, or Owner permission');
  }
  return session;
}

export async function getTenantContext(organizationId: string) {
  return db.organization.findUnique({
    where: { id: organizationId },
    include: {
      warehouses: true,
      carriers: true,
      customFields: true,
      slaPolicies: true,
    },
  });
}

import { PrismaClient } from '../generated/prisma';
import fs from 'fs';
import path from 'path';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// In Vercel serverless environments with SQLite, copy dev.db to /tmp if needed for write access
if (process.env.VERCEL) {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('file:') || !dbUrl) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(sourceDbPath)) {
        try {
          fs.copyFileSync(sourceDbPath, tmpDbPath);
        } catch (e) {
          console.warn('Notice: SQLite serverless copy:', e);
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

export default db;

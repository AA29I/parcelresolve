import { PrismaClient } from '../generated/prisma';
import fs from 'fs';
import path from 'path';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function resolveDatabaseUrl(): string {
  // In Vercel serverless environments, copy pre-seeded SQLite database to writable /tmp
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/mett-global-prod.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'seed.db'),
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'public', 'seed.db'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            break;
          } catch (e) {
            console.warn('Notice: SQLite serverless copy:', e);
          }
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const activeDbUrl = resolveDatabaseUrl();

export const db =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

export default db;

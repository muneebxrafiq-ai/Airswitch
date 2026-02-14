import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv'; // Ensure env is loaded

dotenv.config();

// Use DIRECT_URL to bypass pgbouncer and RLS issues
// DIRECT_URL avoids connection pooling issues with Supabase RLS enforcement
const connectionString = process.env.DATABASE_URL;

console.log('[PrismaClient] Connecting to:', connectionString?.replace(/:[^:]*@/, ':****@'));

const pool = new Pool({
  connectionString,
  // These settings help with Supabase connection stability
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 5000 to 10000
  statement_timeout: 30000,
  query_timeout: 30000,
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('[Pool Error]', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log queries for debugging
prisma.$on('query', (e) => {
  console.log('[Query]', e.query);
  console.log('[Duration]', e.duration, 'ms');
});

export default prisma;

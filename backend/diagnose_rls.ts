#!/usr/bin/env node

/**
 * Supabase RLS Diagnostic Script
 * Run: npx ts-node diagnose_rls.ts
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('\n=== Supabase RLS Diagnostic ===\n');

  // Test DIRECT_URL
  const directUrl = process.env.DIRECT_URL;
  console.log('📍 DIRECT_URL:', directUrl?.replace(/:[^:]*@/, ':****@') || 'NOT SET');

  if (!directUrl) {
    console.error('❌ DIRECT_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: directUrl });

  try {
    console.log('\n🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Check RLS status
    console.log('\n📊 Checking RLS Status on tables...\n');
    const result = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    result.rows.forEach((row: any) => {
      const status = row.rowsecurity ? '🔒 ENABLED' : '🔓 DISABLED';
      console.log(`  ${status} - ${row.tablename}`);
    });

    // Check for RLS policies
    console.log('\n🛡️  Checking RLS Policies...\n');
    const policies = await client.query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (policies.rows.length === 0) {
      console.log('  ✅ No RLS policies found (good for app use)');
    } else {
      console.log(`  ⚠️  Found ${policies.rows.length} RLS policies:\n`);
      policies.rows.forEach((row: any) => {
        console.log(`    - ${row.tablename}: ${row.policyname}`);
      });
    }

    // Test query
    console.log('\n🧪 Testing User query...');
    const userTest = await client.query('SELECT COUNT(*) as count FROM "User"');
    console.log(`  ✅ User table accessible: ${userTest.rows[0].count} users`);

    // Connection info
    console.log('\n📡 Connection Info:');
    const connInfo = await client.query('SELECT version();');
    console.log(`  PostgreSQL: ${connInfo.rows[0].version.split(',')[0]}`);

    console.log('\n✨ Diagnostic complete!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

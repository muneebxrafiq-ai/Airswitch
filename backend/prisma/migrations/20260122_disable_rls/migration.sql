-- Disable RLS on all tables to fix "Tenant or user not found" error
-- This is required for Prisma/PgAdapter to work properly with Supabase

-- Check if RLS is enabled and disable it
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ESim" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Otp" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistrationAttempt" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Token" DISABLE ROW LEVEL SECURITY;

-- Alternative: Drop all RLS policies if they exist
-- This is safer in case policies are preventing operations
DO $$
DECLARE
  policy record;
BEGIN
  FOR policy IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy.policyname) 
      || ' ON ' || quote_ident(policy.schemaname) || '.' || quote_ident(policy.tablename);
  END LOOP;
END $$;

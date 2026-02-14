-- Manual RLS Disabling Script for Supabase
-- Run this in Supabase SQL Editor if Prisma migrations fail

-- 1. DISABLE RLS ON ALL TABLES
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ESim" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Otp" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistrationAttempt" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Token" DISABLE ROW LEVEL SECURITY;

-- 2. VERIFY RLS IS DISABLED
SELECT 
  schemaname,
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '🔓 DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. DROP EXISTING RLS POLICIES (if any)
-- This is optional but recommended to clean up
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
    RAISE NOTICE 'Dropped policy: %.%', policy_record.tablename, policy_record.policyname;
  END LOOP;
END $$;

-- 4. VERIFY RLS POLICIES ARE REMOVED
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
-- Should return no rows if successful

-- 5. TEST CONNECTIVITY (run after disabling RLS)
-- This will fail if user doesn't exist, but should not be RLS error
SELECT 'User count' as test, COUNT(*) as count FROM "User";
SELECT 'Wallet count' as test, COUNT(*) as count FROM "Wallet";

-- Optional: ENABLE RLS AGAIN (if you change your mind)
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
-- ... etc

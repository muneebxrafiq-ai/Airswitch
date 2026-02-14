
const { Client } = require('pg');

async function test(url) {
    const client = new Client({ connectionString: url });
    try {
        console.log(`Testing: ${url.replace(/:[^:]*@/, ':****@')}`);
        await client.connect();
        console.log('SUCCESS');
        await client.end();
        return true;
    } catch (e) {
        console.log('FAILED:', e.message);
        return false;
    }
}

async function run() {
    const host = 'db.ergqnuyrvynlnxlqtrtu.supabase.co';
    const pw1 = 'Dawood1012md';
    const pw2 = 'D@wood1012md';
    const user = 'postgres';

    await test(`postgresql://${user}:${pw1}@${host}:5432/postgres`);
    await test(`postgresql://${user}:${pw2}@${host}:5432/postgres`);

    // Also try project ref in user
    const userRef = 'postgres.ergqnuyrvynlnxlqtrtu';
    await test(`postgresql://${userRef}:${pw1}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`);
    await test(`postgresql://${userRef}:${pw2}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`);
}

run();

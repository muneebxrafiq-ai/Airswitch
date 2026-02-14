
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Dawood1012md@db.ergqnuyrvynlnxlqtrtu.supabase.co:5432/postgres',
    connectionTimeoutMillis: 5000,
});

async function test() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err);
    }
}

test();


const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Dawood1012md@ergqnuyrvynlnxlqtrtu.supabase.co:5432/postgres',
    connectionTimeoutMillis: 5000,
});

async function test() {
    try {
        console.log('Connecting to alternate host...');
        await client.connect();
        console.log('Connected successfully to alternate!');
        await client.end();
    } catch (err) {
        console.error('Alternate connection error:', err.code);
    }
}

test();

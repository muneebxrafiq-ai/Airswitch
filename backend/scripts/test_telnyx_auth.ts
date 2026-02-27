
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

if (!TELNYX_API_KEY) {
    console.error('❌ Error: TELNYX_API_KEY is missing in .env file');
    process.exit(1);
}

console.log('Using Telnyx API Key:', TELNYX_API_KEY.substring(0, 5) + '...');

async function checkTelnyxAuth() {
    try {
        console.log('Testing Telnyx connectivity...');
        // Endpoint to retrieve the current balance, which requires a valid API key
        const response = await axios.get('https://api.telnyx.com/v2/balance', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TELNYX_API_KEY}`
            }
        });

        console.log('✅ Telnyx API Key is VALID.');
        console.log('Account Balance:', response.data.data.balance, response.data.data.currency);
        console.log('Additional Info:', JSON.stringify(response.data.data, null, 2));

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Telnyx API Error:', error.response.status, error.response.statusText);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            if (error.response.status === 401) {
                console.error('⚠️  Likely CAUSE: The API Key is EXPIRED or INVALID.');
            }
        } else {
            console.error('❌ Network or Unknown Error:', error.message);
        }
        process.exit(1);
    }
}

checkTelnyxAuth();

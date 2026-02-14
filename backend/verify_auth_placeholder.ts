
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api/auth';

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const TEST_NAME = 'Test User';

async function runTest() {
    console.log('Starting Auth Verification Test...');
    console.log(`Using email: ${TEST_EMAIL}`);

    try {
        // 1. Initiate Register
        console.log('\n[1] Initiating Registration...');
        await axios.post(`${API_URL}/register`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            name: TEST_NAME
        });
        console.log('✓ Registration initiated. OTP sent (check backend logs).');

        // Manually ask for OTP (Simulated by user input or we need to capture it from logs?)
        // Since we can't interactively input here easily in this script w/o prompt, 
        // we might just stop here or need a way to fetch the OTP from DB if we want full auto test.
        // For now, I will assume I can read the logs.

        // However, I can fetch the OTP from the database directly since I have access to it!
        // I need to import prisma client here.
    } catch (error: any) {
        console.error('✗ Test Failed:', error.response?.data || error.message);
    }
}

// runTest();
// Modifying to actually use Prisma to get the OTP

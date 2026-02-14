
import axios from 'axios';
import prisma from './src/utils/prismaClient';
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
        console.log('✓ Registration initiated.');

        // 2. Fetch OTP from DB
        console.log('\n[2] Fetching OTP from DB...');
        // Wait a bit for DB to update
        await new Promise(r => setTimeout(r, 3000));

        const attempt = await (prisma.registrationAttempt as any).findUnique({
            where: { email: TEST_EMAIL }
        });

        if (!attempt) {
            throw new Error('Registration attempt not found in DB!');
        }
        console.log(`✓ OTP Fetched: ${attempt.otp}`);

        // 3. Verify Registration
        console.log('\n[3] Verifying Registration...');
        const verifyRes = await axios.post(`${API_URL}/verify-registration`, {
            email: TEST_EMAIL,
            otp: attempt.otp
        });
        const verifyData = verifyRes.data as any;
        console.log('✓ Registration verified.');
        console.log(`  Token: ${verifyData.token ? 'Received' : 'Missing'}`);

        // 4. Login
        console.log('\n[4] Testing Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        console.log('✓ Login successful.');

        // 5. Forgot Password
        console.log('\n[5] Testing Forgot Password...');
        await axios.post(`${API_URL}/forgot-password`, {
            email: TEST_EMAIL
        });
        console.log('✓ Forgot Password initiated.');

        // 6. Fetch Reset Token
        console.log('\n[6] Fetching Reset Token from DB...');
        await new Promise(r => setTimeout(r, 3000));
        const tokenRecord = await (prisma.token as any).findFirst({
            where: { email: TEST_EMAIL, type: 'PASSWORD_RESET' }
        });

        if (!tokenRecord) {
            throw new Error('Reset token not found in DB!');
        }
        console.log(`✓ Reset OTP Fetched: ${tokenRecord.token}`);

        // 7. Reset Password
        console.log('\n[7] Resetting Password...');
        const NEW_PASSWORD = 'NewPassword123!';
        await axios.post(`${API_URL}/reset-password`, {
            email: TEST_EMAIL,
            otp: tokenRecord.token,
            newPassword: NEW_PASSWORD
        });
        console.log('✓ Password reset successful.');

        // 8. Login with New Password
        console.log('\n[8] Logging in with New Password...');
        await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: NEW_PASSWORD
        });
        console.log('✓ Login with new password successful.');

        console.log('\n🎉 ALL AUTH TESTS PASSED!');

    } catch (error: any) {
        console.error('✗ Test Failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data));
        }
    } finally {
        await prisma.$disconnect();
    }
}

runTest();

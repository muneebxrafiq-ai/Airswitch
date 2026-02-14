import prisma from './src/utils/prismaClient';

async function checkConnection() {
    try {
        console.log('🔄 Attemping to connect to Supabase...');
        const userCount = await prisma.user.count();
        console.log(`✅ Success! Connected to Supabase.`);
        console.log(`📊 Current User Count: ${userCount}`);
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConnection();

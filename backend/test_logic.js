const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPoints() {
    try {
        console.log('Testing UserPoints logic...');

        // 1. Get a user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No users found in database.');
            return;
        }
        console.log(`Found user: ${user.email} (ID: ${user.id})`);

        // 2. Try to find or create UserPoints
        console.log('Searching for UserPoints...');
        let userPoints = await prisma.userPoints.findUnique({
            where: { userId: user.id },
        });

        if (!userPoints) {
            console.log('UserPoints not found, creating...');
            userPoints = await prisma.userPoints.create({
                data: { userId: user.id },
            });
            console.log('Created UserPoints:', userPoints);
        } else {
            console.log('UserPoints found:', userPoints);
        }

        console.log('Success!');
    } catch (error) {
        console.error('ERROR during logic test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testPoints();

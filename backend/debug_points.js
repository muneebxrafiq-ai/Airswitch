const prisma = require('./src/utils/prismaClient').default;

async function debug() {
    try {
        console.log('Testing points balance logic for a random user...');

        // 1. Get a user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No users found.');
            return;
        }
        console.log('Using user:', user.email);

        // 2. Mocking the controller logic
        const userId = user.id;
        console.log('Searching for UserPoints for userId:', userId);

        let userPoints = await prisma.userPoints.findUnique({
            where: { userId },
        });

        if (!userPoints) {
            console.log('UserPoints not found, creating...');
            userPoints = await prisma.userPoints.create({
                data: { userId },
            });
            console.log('Created UserPoints successfully');
        } else {
            console.log('Found existing UserPoints:', userPoints);
        }

        const equivalentUSD = userPoints.availablePoints / 100;
        console.log('Result:', {
            totalPoints: userPoints.totalPoints,
            availablePoints: userPoints.availablePoints,
            redeemedPoints: userPoints.redeemedPoints,
            equivalentUSD: equivalentUSD.toFixed(2),
        });

        console.log('Logic test PASSED');
    } catch (err) {
        console.error('Logic test FAILED with error:');
        console.error(err);
    } finally {
        process.exit(0);
    }
}

debug();

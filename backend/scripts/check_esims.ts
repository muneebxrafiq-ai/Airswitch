import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const esims = await prisma.eSim.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });

    console.log('Recent eSIMs:');
    esims.forEach(sim => {
        console.log(`ID: ${sim.id}`);
        console.log(`  User: ${sim.user?.email} (${sim.userId})`);
        console.log(`  TelnyxID: ${sim.telnyxSimId}`);
        console.log(`  Status: ${sim.status}`);
        console.log(`  Created: ${sim.createdAt}`);
        console.log('-------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

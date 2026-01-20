
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected.');

        console.log('Reading users...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Users found:', users.length);

        console.log('Attempting write...');
        const email = `test_script_${Date.now()}@test.com`;
        const user = await prisma.user.create({
            data: {
                email,
                password: 'hash',
                name: 'Script User',
                wallet: { create: { balanceUSD: 0, balanceNGN: 0 } }
            }
        });
        console.log('User created:', user.id);

    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

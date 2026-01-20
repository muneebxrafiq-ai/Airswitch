import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import esimRoutes from './routes/esimRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/esim', esimRoutes);

import prisma from './utils/prismaClient';

app.get('/', (req: Request, res: Response) => {
    res.send('Airswitch Backend is Running!');
});

const start = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to Supabase Database');
        app.listen(PORT as number, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

start();

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import esimRoutes from './routes/esimRoutes';
import webhookRoutes from './routes/webhookRoutes';
import paymentRoutes from './routes/paymentRoutes';
import telnyxRoutes from './routes/telnyxRoutes';
import referralRoutes from './routes/referralRoutes';
import pointsRoutes from './routes/pointsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    credentials: true
}));

// Special handling for Stripe Webhooks - MUST be before express.json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/esim', esimRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/telnyx', telnyxRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);

import prisma from './utils/prismaClient';

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Airswitch Backend is Running!');
});

const start = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to Database');
        app.listen(PORT as number, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Keep-alive heartbeat and exit logging
setInterval(() => {
    console.debug(`[Heartbeat] ${new Date().toISOString()} - Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
}, 30000);

process.on('exit', (code) => {
    console.log(`[PROCESS] Process exited with code: ${code}`);
});

process.on('SIGINT', () => {
    console.log('[PROCESS] Received SIGINT. Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[PROCESS] Received SIGTERM. Shutting down...');
    process.exit(0);
});

start();

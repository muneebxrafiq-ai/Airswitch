import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_dev_only';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        console.log('Attempting to register:', email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User AND Wallet in one transaction
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                wallet: {
                    create: {
                        balanceNGN: 0.0,
                        balanceUSD: 0.0,
                    },
                },
            },
            include: {
                wallet: true,
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, wallet: user.wallet } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

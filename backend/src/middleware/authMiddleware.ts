import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
    user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_dev_only';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error: any) {
        console.error('JWT Verification Failed:', error.message);
        console.error('Token start:', token.substring(0, 10) + '...');
        // console.error('Token end:', token.substring(token.length - 10)); // Optional
        res.status(403).json({ error: 'Invalid token', details: error.message });
    }
};

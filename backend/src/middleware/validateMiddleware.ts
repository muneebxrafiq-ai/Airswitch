import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map((detail) => ({
                message: detail.message,
                path: detail.path,
            }));
            return res.status(400).json({ status: 'error', errors });
        }

        next();
    };
};

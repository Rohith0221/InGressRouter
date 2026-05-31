import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_secret = process.env.JWT_SECRET;

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
    {
        res.status(401).json({ error: " Missing or invalid Authorization header"});
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token,  JWT_secret);

        (req as any).user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({ error: "Token is invalid or expired"})\
    }
}
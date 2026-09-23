import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {

    const token = req.cookies.ingress_admin_jwt;

    if (!token) {
        res.status(401).json({ error: "Missing or invalid auth token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string);
        (req as any).user = decoded;
        next();
    }
    catch (error: any) {
        res.status(403).json({ error: "Session is invalid or expired" });
    }
}
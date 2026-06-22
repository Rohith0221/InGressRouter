import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {

    const authHeader = req.headers.authorization;

    console.log("\n AUTH DIAGNOSTICS  \n ");
    console.log('1. Header Received:');

    if (!authHeader || !authHeader.startsWith("Bearer "))
    {
        res.status(401).json({ error: " Missing or invalid Authorization header"});
    }

    const token = authHeader.split(' ')[1];


    try {

        console.log(" Attempting to verify token....");
        const decoded = jwt.verify(token, JWT_SECRET as string);

        (req as any).user = decoded;

        console.log('4. Success!');
        next();
    }
    catch (error: any) {

        console.error("\n Verification failed: \n");
        console.error(" Error Name:", error.name);
        console.error(" Error Message:", error.message);
        console.error(" Token Length:", token.length);


        res.status(403).json({ error: "Token is invalid or expired"});
    }
}
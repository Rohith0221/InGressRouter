import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {

    const token = req.cookies.ingress_admin_jwt;

    console.log("\n AUTH DIAGNOSTICS  \n ");
    console.log('1. Header Received:');

    if (!token)
    {
        console.log(" Blocked Login Attempt: No cookie found!")
        res.status(401).json({ error: " Missing or invalid Auth cookie" });
        return;
    }

    try {

        console.log(" Attempting to verify cookie token....");
        const decoded = jwt.verify(token, JWT_SECRET as string);

        (req as any).user = decoded;

        console.log('4. Verification Success!');
        next();
    }
    catch (error: any) {

        console.error("\n Verification failed: \n");
        console.error(" Error Name:", error.name);
        console.error(" Error Message:", error.message);

        res.status(403).json({ error: "Session is invalid or expired"});
    }
}
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import InGressRouter from './routes/InGress';
import apiRouter from './routes/api';
import cookieParser from 'cookie-parser';

const app: Application = express();

app.use(helmet());
app.use(cookieParser());

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use('/ingress', InGressRouter);

app.use('/api/v1', express.json(), apiRouter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});

export default app;
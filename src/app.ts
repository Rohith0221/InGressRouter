import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import InGressRouter from './routes/InGress';
import apiRouter from './routes/api';

const app: Application = express();
const cors = require("cors");

app.use(helmet());

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use('/ingress', InGressRouter);

app.use('/api/v1', express.json(), apiRouter);

app.get('/health', (req: Request, res: Response) => {

    res.status(200).json({ status: "healthy",
        timestamp: new Date().toISOString()
    })
});

export default app;
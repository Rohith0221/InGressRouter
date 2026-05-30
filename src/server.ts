import InGressRouter from './routes/ingress';
import apiRouter from './routes/api';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { db } from './db';

const app: Application = express();

app.use(helmet());

app.get('/api', express.json(), apiRouter);

app.use('/ingress', InGressRouter);

app.get('/health', async (req: Request, res: Response) => {

    try {
        await db.query("SELECT 1");
        res.status(200).json({ status: "healthy", database: "connected",
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(503).json({ status: "unhealthy", database: "disconnected" });
    }
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found"});
});

const PORT = process.env.PORT || 3000;

const startServer = () => {
    try {
        await db.query("SELECT 1");
        console.log(" PostgreSQL connection established");

        app.listen(PORT, () => {
            console.log(" InGress Router listening on port ${PORT");
        });
    } catch (error) {
        console.error("Failed to start server: Database unreachable", error);
        process.exit(1);
    }
};

startServer();
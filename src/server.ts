import app from './app';
import { db } from './db';

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found"});
});

const PORT = process.env.PORT || 3000;


const startServer = async () => {

    try {

        await db.query("SELECT 1");
        console.log(" Database connection established successfully");

        app.listen(PORT, () => {
            console.log(" InGress Router listening on port ${PORT}");
        });
    }
    catch (error) {
        console.log("Failed to start server: Database unreachable", error);
        process.exit(1);
    }
}

startServer();


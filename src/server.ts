import app from './app';
import { db } from './db/pool';
import "dotenv/config";

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'ADMIN_PASSWORD_HASH', 'DATABASE_URL_PROD'];

for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
        console.error(`[FATAL] Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

const PORT = process.env.PORT || 3000;


const startServer = async () => {

    try {

        await db.query("SELECT 1");
        console.log(" Database connection established successfully");

        app.listen(PORT, () => {
            console.log(` InGress Router listening on port ${PORT}`);
        });
    }
    catch (error) {
        console.log("Failed to start server: Database unreachable", error);
        process.exit(1);
    }
}

startServer();


import { Pool} from 'pg';
import "dotenv/config";

export const db = new Pool({
    connectionString: process.env.DATABASE_URL_PROD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

db.on('error', (err) => {
    console.error("Unexpected error on idle database client", err);
    process.exit(-1);
});
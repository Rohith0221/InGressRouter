import { Pool} from 'pg';

export const db = new Pool({
    connectionString: process.env.DATABASE_URL_TEST,
    max: 20,
    idleTimeoutMillis: 2000,
});

db.on('error', (err) => {
    console.error("Unexpected error on idle database client", err);
    process.exit(-1);
});
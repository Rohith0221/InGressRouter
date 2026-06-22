import {Request, Response} from 'express';
import { db } from '../db/pool';

export const getEvents = async (req: Request, res: Response): Promise<void> => {

    try {
        
        const query = `
        SELECT
            e.id,
            ep.slug,
            e.payload,
            e.processed,
            e.created_at AS timestamp
        FROM events e
        JOIN endpoints ep ON e.endpoint_id = ep.id
        ORDER BY e.created_at DESC
        LIMIT 100`;

        const result = await db.query(query);

        const formattedData = result.rows.map(row => ({
            id: row.id,
            path: row.slug,
            payload: row.payload,
            timestamp: row.timestamp,
            status: row.processed ? 200 : 202
        }));

        res.status(200).json(formattedData);
    }
    catch (error) {
        console.error(" Failed to fetch events:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getDLQEvents = async (req: Request, res: Response): Promise<void> => {

    try {

        const query = `
        SELECT 
            dlq.id,
            dlq.endpoint_id,
            dlq.created_at AS timestamp,
            dlq.payload,
            dlq.error_reason,
            ep.slug AS path
        FROM dlq_events dlq
        JOIN endpoints ep ON dlq.endpoint_id = ep.id
        WHERE replayed = FALSE
        ORDER BY dlq.created_at DESC
        LIMIT 100`;

        const result = await db.query(query);

        const formattedData = result.rows.map(row => ({
            id: row.id,
            timestamp: row.timestamp,
            payload: row.payload,
            error: row.error,
            path: row.path,
        }));
        // const result = await db.query('SELECT id, endpoint_id, payload, created_at FROM dlq_events WHERE replayed = FALSE ORDER BY created_at DESC LIMIT 100');
        res.status(200).json(formattedData);
    }
    catch (error) {
        console.error("Failed to fetch DLQ events:", error);
        res.status(500).json({ error: " Internal Server Error"});
    }
};

export const replayDlqEvent = async (req: Request, res: Response): Promise<void> => {

    const {id} = req.params;

    console.log(`\n [REPLAY INITIATED] Target Event ID: ${id}`);
    console.log(`\n [REPLAY AUTH] User Token Present: ${!!req.headers.authorization}`);
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const dlqResult = await client.query(
            'SELECT endpoint_id, payload FROM dlq_events WHERE id = $1 AND replayed = FALSE FOR UPDATE',[id]);

        if (dlqResult.rowCount === 0) {
            res.status(404).json({ error: 'Event not found or already replayed'});
            await client.query('ROLLBACK');
            return;
        }

        const {endpoint_id, payload} = dlqResult.rows[0];

        await client.query(
            'INSERT INTO events (endpoint_id, payload) VALUES ($1, $2)',
            [endpoint_id, JSON.stringify(payload)]
        );

        await client.query(
            'UPDATE dlq_events SET replayed = TRUE WHERE id = $1', [id]
        );

        await client.query('COMMIT');

        res.status(200).json({ status: "Event replayed successfully"});
        
    }
    catch (error) {

        await client.query('ROLLBACK');
        console.error(`\n [REPLAY ERROR] Failed to replay DLQ event: ${error}`);
        res.status(500).json({ error: "Failed to replay DLQ event"});
    }
    finally {
        client.release();
    }
}
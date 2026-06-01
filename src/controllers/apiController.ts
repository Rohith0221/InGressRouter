import {Request, Response} from 'express';
import { db } from '../db/pool';

export const getEvents = async (req: Request, res: Response): Promise<void> => {

    try {

        const result = await db.query('SELECT id, endpoint_id, payload, processed, created_at FROM events ORDER BY created_at DESC LIMIT 100');
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error(" Failed to fetch events:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getDLQEvents = async (req: Request, res: Response): Promise<void> => {

    try {

        const result = await db.query('SELECT id, endpoint_id, payload, created_at FROM dlq_events WHERE replayed = FALSE ORDER BY created_at DESC LIMIT 100');
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Failed to fetch DLQ events:", error);
        res.status(500).json({ error: " Internal Server Error"});
    }
};

export const replayDlqEvent = async (req: Request, res: Response): Promise<void> => {

    const {id} = req.params;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const dlqResult = await client.query(
            'SELECT endpoint_id, headers, payload FROM dlq_events WHERE id = $1 AND replayed = FALSE FOR UPDATE',[id]);

        if (dlqResult.rowCount === 0) {
            res.status(404).json({ error: 'Event not found or already replayed'});
            await client.query('ROLLBACK');
            return;
        }

        const {endpoint_id, headers, payload} = dlqResult.rows[0];

        await client.query(
            'INSERT INTO events (endpoint_id, headers, payload) VALUES ($1, $2, $3)',
            [endpoint_id, headers, payload]
        );

        await client.query(
            'UPDATE dlq_events SET replayed = TRUE WHERE id = $1', [id]
        );

        await client.query('COMMIT');

        res.status(200).json({ status: "Event replayed successfully"});
        
    }
    catch (error) {

        await client.query('ROLLBACK');
        console.error("Failed to replay DLQ event");
        res.status(500).json({ error: "Failed to replay DLQ event"});
    }
    finally {
        client.release();
    }
}
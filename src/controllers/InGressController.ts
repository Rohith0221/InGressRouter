import {Request, Response} from 'express';
import { db } from '../db/pool';

export const ingestWebhook = async (req : Request, res : Response): Promise<void> => {

    const { slug } = req.params;
    const headers = req.headers;
    const payload = req.body;
    const isMalformed = (req as any).isMalformedPayload || false;

    const client = await db.connect();

    try {

        await client.query('BEGIN');

        const endpointResult = await client.query(
            'SELECT id FROM endpoints WHERE slug = $1 AND is_active = TRUE',
            [slug]
        );

        if (endpointResult.rowCount === 0) {

            res.status(404).json({ error: "Endpoint not found or inactive"});
            await client.query('ROLLBACK');
            return;
        }

        const endpointId = endpointResult.rows[0].id;

        if (isMalformed) {

            await client.query(
                'INSERT INTO dlq_events (endpoint_id, headers, payload, error_reason) VALUES ($1, $2, $3, $4)',
                [endpointId, headers, payload, "Malformed JSON payload intercepted"]
            );
        } else {
            await client.query(
                'INSERT INTO events (endpoint_id, headers, payload) VALUES ($1, $2, $3)',
                [endpointId, headers, payload]
            )
        }

        await client.query('COMMIT');

        res.status(202).json({ status: "Ingested"});
    }
    catch (error) {

        await client.query("ROLLBACK");
        console.error("Ingestion transaction failed:", error);
        res.status(500).json({ error: "Internal Server Error"});
    }
    finally {
        client.release();
    }
};
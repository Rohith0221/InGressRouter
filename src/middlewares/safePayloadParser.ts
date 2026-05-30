import {Request, Response, NextFunction} from 'express';

export const safePayloadParser = (req: Request, res: Response, next: NextFunction): void => {

    let rawData = '';
    req.setEncoding('utf8');

    req.on('data', (chunk) => {
        rawData += chunk;
    });

    req.on('end', () => {
        try {
            req.body = rawData ? JSON.parse(rawData) : {};
        }
        catch (error) {

            req.body = { _raw_malformed_payload: rawData};

            (req as any).isMalformedPayload = true;
        }

        next();
    });
};
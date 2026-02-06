import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
    try {
        const jsonVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
        let credentials: any = {};
        let parseError = null;

        if (jsonVar) {
            try {
                credentials = JSON.parse(jsonVar);
            } catch (e) {
                parseError = e instanceof Error ? e.message : 'Unknown Parse Error';
            }
        }

        let key = credentials.private_key || process.env.GOOGLE_PRIVATE_KEY || '';
        const originalKeySnippet = key.substring(0, 20);
        const originalKeyHex = Buffer.from(originalKeySnippet).toString('hex');

        // Apply same Sanitization as in google.ts
        if (key) {
            key = key.replace(/\r/g, '').replace(/\\n/g, '\n');
        }

        const sanitizedKeySnippet = key.substring(0, 20);
        const sanitizedKeyHex = Buffer.from(sanitizedKeySnippet).toString('hex');

        // Attempt Auth Construction
        let authConstructionError = null;
        let signingError = null;
        let auth: any = null;

        try {
            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: credentials.client_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: key,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } catch (e) {
            authConstructionError = e instanceof Error ? e.message : 'Unknown Auth Error';
        }

        if (auth) {
            try {
                await auth.getAccessToken();
            } catch (e) {
                signingError = e instanceof Error ? e.message : 'Unknown Signing Error';
                if (e instanceof Error && e.stack) signingError += ' ' + e.stack;
            }
        }

        return NextResponse.json({
            hasJsonVar: !!jsonVar,
            jsonParseError: parseError,
            clientEmail: credentials.client_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            originalKeySnippet,
            originalKeyHex,
            sanitizedKeySnippet,
            sanitizedKeyHex,
            authConstructionError,
            signingError,
            nodeVersion: process.version,
            env: process.env.NODE_ENV
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Checking failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

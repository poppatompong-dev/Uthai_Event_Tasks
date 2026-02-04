import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google';
import { Settings } from '@/lib/types';

export async function GET() {
    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Settings!A2:B100',
        });

        const values = response.data.values || [];
        const settings: Settings = {
            schoolName: '',
            educationOffice: '',
            schoolLogo: '',
        };

        values.forEach((row) => {
            const key = row[0] as keyof Settings;
            if (key && row[1] && key in settings) {
                settings[key] = row[1];
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch settings',
                details: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const settings: Settings = await request.json();
        const sheets = getSheets();

        // Clear and update settings
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Settings!A2:B100',
        });

        const values = Object.entries(settings).map(([key, value]) => [key, value]);

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Settings!A2',
            valueInputOption: 'RAW',
            requestBody: { values },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json(
            {
                error: 'Failed to save settings',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

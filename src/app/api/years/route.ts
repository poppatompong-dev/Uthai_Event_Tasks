import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google';
import { Year } from '@/lib/types';

export async function GET() {
    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Years!A2:E100',
        });

        const values = response.data.values || [];
        const years: Year[] = values.map((row) => ({
            id: row[0]?.toString() || '',
            name: row[1]?.toString() || '',
            startDate: row[2] || '',
            endDate: row[3] || '',
            isCurrent: row[4] === true || row[4] === 'TRUE' || row[4] === 'true',
        }));

        return NextResponse.json(years);
    } catch (error) {
        console.error('Error fetching years:', error);
        return NextResponse.json(
            { error: 'Failed to fetch years' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const years: Year[] = await request.json();
        const sheets = getSheets();

        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Years!A2:E1000',
        });

        if (years.length > 0) {
            const values = years.map((year) => [
                year.id,
                year.name,
                year.startDate,
                year.endDate,
                year.isCurrent,
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Years!A2',
                valueInputOption: 'RAW',
                requestBody: { values },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving years:', error);
        return NextResponse.json(
            { error: 'Failed to save years' },
            { status: 500 }
        );
    }
}

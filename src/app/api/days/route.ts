import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google';
import { Day, DayEntry, Attachment } from '@/lib/types';

export async function GET() {
    try {
        // Check if Google credentials are configured
        if (!SPREADSHEET_ID) {
            console.log('No SPREADSHEET_ID configured, returning empty days array for local dev');
            return NextResponse.json([]);
        }

        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Days!A2:E9999',
        });

        const values = response.data.values || [];
        const days: Day[] = values.map((row) => {
            let entries: DayEntry[] = [];
            let attachments: Attachment[] = [];

            try {
                if (row[3]) entries = JSON.parse(row[3]);
                if (row[4]) attachments = JSON.parse(row[4]);
            } catch (e) {
                console.error('Error parsing JSON for row:', row[0], e);
            }

            return {
                id: row[0]?.toString() || '',
                monthId: row[1]?.toString() || '',
                date: row[2] || '',
                entries,
                attachments,
            };
        });

        return NextResponse.json(days);
    } catch (error) {
        console.error('Error fetching days:', error);
        // Return empty array for local development instead of 500 error
        return NextResponse.json([]);
    }
}

export async function POST(request: NextRequest) {
    try {
        const days: Day[] = await request.json();
        const sheets = getSheets();

        // Clear and batch update (simplified for now, replace entire sheet)
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Days!A2:E99999',
        });

        if (days.length > 0) {
            const values = days.map((day) => [
                day.id,
                day.monthId,
                day.date,
                JSON.stringify(day.entries),
                JSON.stringify(day.attachments || []),
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Days!A2',
                valueInputOption: 'RAW',
                requestBody: { values },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving days:', error);
        return NextResponse.json(
            { error: 'Failed to save days' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const updatedDay: Day = await request.json();
        const sheets = getSheets();

        // Find the row index to update
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Days!A2:A9999',
        });

        const ids = response.data.values || [];
        const rowIndex = ids.findIndex(row => row[0] === updatedDay.id);

        if (rowIndex === -1) {
            // Append if not found
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Days!A2',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[
                        updatedDay.id,
                        updatedDay.monthId,
                        updatedDay.date,
                        JSON.stringify(updatedDay.entries),
                        JSON.stringify(updatedDay.attachments || []),
                    ]],
                },
            });
        } else {
            // Update existing row (1-indexed, +2 because A2 and 0-index)
            const actualRow = rowIndex + 2;
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `Days!A${actualRow}:E${actualRow}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[
                        updatedDay.id,
                        updatedDay.monthId,
                        updatedDay.date,
                        JSON.stringify(updatedDay.entries),
                        JSON.stringify(updatedDay.attachments || []),
                    ]],
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating day:', error);
        return NextResponse.json(
            { error: 'Failed to update day' },
            { status: 500 }
        );
    }
}

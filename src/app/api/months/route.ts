import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google';
import { Month } from '@/lib/types';

const monthsThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export async function GET() {
    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Months!A2:D1000',
        });

        const values = response.data.values || [];
        const months: Month[] = values.map((row) => {
            const monthValue = row[2] || '';
            let name = row[3] || '';

            // Generate name if missing
            if (!name && monthValue) {
                const [year, month] = monthValue.split('-');
                const monthIndex = parseInt(month) - 1;
                const thaiYear = parseInt(year) + 543;
                name = `${monthsThai[monthIndex]} ${thaiYear}`;
            }

            return {
                id: row[0]?.toString() || '',
                yearId: row[1]?.toString() || '',
                month: monthValue,
                name: name,
            };
        });

        // Sort by month
        months.sort((a, b) => a.month.localeCompare(b.month));

        return NextResponse.json(months);
    } catch (error) {
        console.error('Error fetching months:', error);
        return NextResponse.json(
            { error: 'Failed to fetch months' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const months: Month[] = await request.json();
        const sheets = getSheets();

        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Months!A2:D10000',
        });

        if (months.length > 0) {
            const values = months.map((month) => [
                month.id,
                month.yearId,
                month.month,
                month.name,
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Months!A2',
                valueInputOption: 'RAW',
                requestBody: { values },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving months:', error);
        return NextResponse.json(
            { error: 'Failed to save months' },
            { status: 500 }
        );
    }
}

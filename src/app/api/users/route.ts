import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google';
import { User } from '@/lib/types';

export async function GET() {
    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A2:D100',
        });

        const values = response.data.values || [];
        const users: User[] = values.map((row) => ({
            id: row[0]?.toString() || '',
            username: row[1] || '',
            password: row[2] || '',
            fullname: row[3] || '',
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const users: User[] = await request.json();
        const sheets = getSheets();

        // Clear and update users
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A2:D1000',
        });

        if (users.length > 0) {
            const values = users.map((user) => [
                user.id,
                user.username,
                user.password,
                user.fullname,
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Users!A2',
                valueInputOption: 'RAW',
                requestBody: { values },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving users:', error);
        return NextResponse.json(
            { error: 'Failed to save users' },
            { status: 500 }
        );
    }
}

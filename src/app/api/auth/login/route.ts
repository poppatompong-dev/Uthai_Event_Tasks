import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();
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

        const user = users.find(
            (u) => u.username === username && u.password === password
        );

        if (user) {
            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    fullname: user.fullname,
                },
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}

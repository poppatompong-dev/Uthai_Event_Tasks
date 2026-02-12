import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
    let body;
    try {
        body = await request.json();
        const { username, password } = body;

        // Local development fallback - allow admin/admin login when no Google credentials
        if (!SPREADSHEET_ID) {
            console.log('No SPREADSHEET_ID configured, using local dev login mode');
            if (username === 'admin' && password === 'admin') {
                return NextResponse.json({
                    success: true,
                    user: {
                        id: 'local-admin',
                        username: 'admin',
                        fullname: 'Local Admin (Dev Mode)',
                    },
                });
            }
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

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
        // For local development, allow admin/admin as fallback
        const { username, password } = body || { username: '', password: '' };
        if (username === 'admin' && password === 'admin') {
            return NextResponse.json({
                success: true,
                user: {
                    id: 'local-admin',
                    username: 'admin',
                    fullname: 'Local Admin (Dev Mode)',
                },
            });
        }
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}

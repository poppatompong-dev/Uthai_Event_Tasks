const { google } = require('googleapis');
const path = require('path');

async function testConnection() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'service-account.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1inj9Rsm8wwa5tC1LIxFUUaXnSseRvbi_dyYNYEJmIlA';

    try {
        console.log('Testing connection to Spreadsheet ID:', spreadsheetId);

        const response = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        console.log('✅ Successfully connected!');
        console.log('📄 Title:', response.data.properties.title);
        console.log('📋 Sheets:', response.data.sheets.map(s => s.properties.title).join(', '));
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.response) {
            console.error('Error status:', error.response.status);
            console.error('Error data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testConnection();

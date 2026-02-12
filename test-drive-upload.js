const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

async function testUpload() {
    const KEY_FILE = path.join(__dirname, 'service-account.json');
    const FOLDER_ID = '1R4z98vXcsBzaprY3yksXt7g0mwOari-s'; // From .env.local

    console.log('Using Key File:', KEY_FILE);
    console.log('Target Folder ID:', FOLDER_ID);

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 1. Check if we can LIST the folder (Read Access)
        console.log('Checking read access...');
        try {
            await drive.files.get({ fileId: FOLDER_ID });
            console.log('✅ Folder found and readable.');
        } catch (e) {
            console.error('❌ Folder NOT found or not readable. Did you share it?');
            throw e;
        }

        // 2. Try to UPLOAD a file (Write Access)
        console.log('Attempting upload...');
        const fileMetadata = {
            name: 'test-upload-' + Date.now() + '.txt',
            parents: [FOLDER_ID],
        };
        const media = {
            mimeType: 'text/plain',
            body: Readable.from(['Hello World']),
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log('✅ Upload Successful! File ID:', file.data.id);

        // 3. Clean up (Delete test file)
        await drive.files.delete({ fileId: file.data.id });
        console.log('✅ Cleanup Successful (File deleted).');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testUpload();

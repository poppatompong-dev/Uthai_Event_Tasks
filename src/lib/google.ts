import { google, sheets_v4, drive_v3 } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

// Initialize Google Auth
function getAuth() {
  // 1. Try to get credentials from environment variables (for Vercel/Netlify)
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    console.log('Using Environment Variables for Google Auth');
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        // Make sure to handle escaped newlines in the private key
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });
  }

  // 2. Fallback to local service-account.json (for Local development)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require('../../service-account.json');
    console.log('Using service-account.json for Google Auth');
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });
  } catch (error) {
    console.error('Google Auth Error: Missing both Environment Variables and service-account.json');
    throw new Error('Google authentication credentials missing');
  }
}

export function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

export function getDrive(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getAuth() });
}

export { SPREADSHEET_ID, FOLDER_ID };

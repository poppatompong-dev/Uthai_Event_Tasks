import { google, sheets_v4, drive_v3 } from 'googleapis';

// Load service account credentials
// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require('../../service-account.json');

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

// Initialize Google Auth using credentials from JSON file
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
  return auth;
}

export function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

export function getDrive(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getAuth() });
}

export { SPREADSHEET_ID, FOLDER_ID };

import { google, sheets_v4, drive_v3 } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

// Initialize Google Auth using JWT directly
function getAuth() {
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // 1. Try Full JSON Env Var (Priority)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (credentials.client_email && credentials.private_key) {
        clientEmail = credentials.client_email;
        privateKey = credentials.private_key;
        console.log('Loaded credentials from GOOGLE_SERVICE_ACCOUNT_JSON');
      }
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON', e);
    }
  }

  // 2. Try Base64 Encoded Key if not yet found
  if (!privateKey && process.env.GOOGLE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
      console.log('Loaded credentials from GOOGLE_PRIVATE_KEY_BASE64');
    } catch (e) {
      console.error('Failed to decode GOOGLE_PRIVATE_KEY_BASE64', e);
    }
  }

  if (!clientEmail || !privateKey) {
    console.error('Missing Google Service Account Credentials');
    throw new Error('Missing Google Credentials');
  }

  // Sanitize Private Key
  // Remove potential double-escaped newlines and carriage returns
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');
  }

  try {
    console.log(`Initializing JWT with email: ${clientEmail}`);
    // Use JWT client directly to avoid GoogleAuth auto-discovery issues
    const jwtClient = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    });

    return jwtClient;
  } catch (error) {
    console.error('Failed to create JWT client', error);
    throw error;
  }
}

export function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

export function getDrive(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getAuth() });
}

export { SPREADSHEET_ID, FOLDER_ID };

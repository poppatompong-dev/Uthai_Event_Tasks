import { google, sheets_v4, drive_v3 } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

// Initialize Google Auth
function getAuth() {
  // 0. Try Full JSON Env Var (Most Robust for Vercel)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      console.log('Loaded auth from GOOGLE_SERVICE_ACCOUNT_JSON object');

      // Sanitize private key: ensure correct newlines for OpenSSL 3
      if (credentials.private_key) {
        // Remove potential Carriage Returns (CR) which OpenSSL might dislike
        credentials.private_key = credentials.private_key.replace(/\r/g, '');
        // Replace literal \n with real newlines just in case
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

        const snippet = credentials.private_key.substring(0, 15);
        console.log('Key Snippet Hex:', Buffer.from(snippet).toString('hex'));
        console.log('Key Snippet Str:', snippet);
      }

      return new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });
    } catch (e) {
      console.error('Failed to load auth from GOOGLE_SERVICE_ACCOUNT_JSON', e);
    }
  }

  // 1. Try to load from service-account.json first for Local Development
  if (process.env.NODE_ENV !== 'production') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require('../../service-account.json');
      console.log('Successfully loaded Google Auth from service-account.json');

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
      console.warn('Local service-account.json could not be loaded, using Env Vars instead.');
    }
  }

  // 2. Try Environment Variables (Primary for Vercel/Production)
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
      console.log('Using Base64-decoded private key');
    } catch (e) {
      console.error('Failed to decode Base64 Private Key', e);
    }
  } else if (privateKey) {
    console.log('Using raw GOOGLE_PRIVATE_KEY');
    let cleanKey = privateKey.replace(/\\n/g, '\n');
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      cleanKey = cleanKey.slice(1, -1);
    }
    privateKey = cleanKey;
  }

  if (clientEmail && privateKey) {
    console.log(`Attempting auth with client_email: ${clientEmail}`);
    try {
      return new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });
    } catch (error) {
      console.error('Google Auth Error (Env Vars):', error);
    }
  }

  console.error('Google Auth Error: Missing Google API Configuration');
  throw new Error('Google authentication credentials missing or invalid');
}

export function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

export function getDrive(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getAuth() });
}

export { SPREADSHEET_ID, FOLDER_ID };

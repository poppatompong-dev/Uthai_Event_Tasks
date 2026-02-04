import { google, sheets_v4, drive_v3 } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

// Initialize Google Auth
function getAuth() {
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
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    try {
      // Clean up private key: handle both literal \n and encoded \\n, and remove surrounding quotes
      let cleanKey = privateKey.replace(/\\n/g, '\n');
      if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
        cleanKey = cleanKey.slice(1, -1);
      }

      return new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: cleanKey,
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

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app: admin.app.App;
let authInstance: admin.auth.Auth | null = null;

try {
  if (!admin.apps || admin.apps.length === 0) {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      const keyPath = join(__dirname, 'config', 'firebase-admin-key.json');
      const keyFile = readFileSync(keyPath, 'utf8');
      serviceAccount = JSON.parse(keyFile);
    }

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    authInstance = app.auth();
    console.log('Firebase Admin initialized successfully');
  } else {
    app = admin.apps[0] as admin.app.App;
    authInstance = app.auth();
    console.log('Using existing Firebase Admin app');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  throw error;
}

export const auth = authInstance!;
export default app;

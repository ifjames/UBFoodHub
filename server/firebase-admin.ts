import admin from 'firebase-admin';

let app: admin.app.App;
let authInstance: admin.auth.Auth | null = null;

try {
  if (!admin.apps || admin.apps.length === 0) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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

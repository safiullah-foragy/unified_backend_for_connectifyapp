import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = async () => {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    // Check if service account file exists
    let credential;
    
    // Try to use service account file first
    try {
      const serviceAccountPath = join(__dirname, '..', 'firebase-service-account.json');
      const serviceAccountData = await readFile(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountData);
      credential = admin.credential.cert(serviceAccount);
    } catch (fileError) {
      // Fall back to environment variables
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
        // Check if private key looks valid
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        if (!privateKey.includes('BEGIN PRIVATE KEY')) {
          console.warn('⚠️  Firebase private key appears invalid. Skipping Firebase initialization.');
          console.warn('   Storage operations will still work via Supabase.');
          return null;
        }
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        });
      } else {
        console.warn('⚠️  Firebase credentials not found. Skipping Firebase initialization.');
        console.warn('   Storage operations will still work via Supabase.');
        return null;
      }
    }

    admin.initializeApp({
      credential: credential,
      projectId: process.env.FIREBASE_PROJECT_ID || 'myapp-6cbbf',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'myapp-6cbbf.firebasestorage.app'
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
    return admin.app();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.warn('   Continuing without Firebase. Storage will use Supabase.');
    return null;
  }
};

/**
 * Get Firebase Admin Auth instance
 */
export const getFirebaseAuth = async () => {
  if (!firebaseInitialized) {
    await initializeFirebase();
  }
  return admin.auth();
};

/**
 * Get Firestore instance
 */
export const getFirestore = async () => {
  if (!firebaseInitialized) {
    await initializeFirebase();
  }
  return admin.firestore();
};

/**
 * Get Firebase Storage instance
 */
export const getStorage = async () => {
  if (!firebaseInitialized) {
    await initializeFirebase();
  }
  return admin.storage();
};

export default admin;

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    // Check if service account file exists
    let credential;
    
    // Try to use service account file first
    try {
      const serviceAccount = await import('../firebase-service-account.json', {
        assert: { type: 'json' }
      });
      credential = admin.credential.cert(serviceAccount.default);
    } catch (fileError) {
      // Fall back to environment variables
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        });
      } else {
        throw new Error('Firebase credentials not found. Please provide service account file or environment variables.');
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
    throw error;
  }
};

/**
 * Get Firebase Admin Auth instance
 */
export const getFirebaseAuth = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.auth();
};

/**
 * Get Firestore instance
 */
export const getFirestore = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.firestore();
};

/**
 * Get Firebase Storage instance
 */
export const getStorage = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.storage();
};

export default admin;

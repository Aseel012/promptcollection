const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount;

// Force Environment Variables (For Render / Production)
console.log('🌐 Loading Firebase Credentials from environment variables...');

// dotenv correctly strips quotes, but leaves escaped newlines depending on format
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\\n');
}

serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
};
// Final Validation
if (!serviceAccount.privateKey) {
    console.error('❌ FIREBASE_PRIVATE_KEY is missing or invalid!');
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'promptlib-56d93.firebasestorage.app'
    });
    console.log('✅ Firebase Admin Initialized Successfully');
} catch (error) {
    console.error('❌ Firebase Admin Initialization FAILED:', error.message);
}

module.exports = admin;

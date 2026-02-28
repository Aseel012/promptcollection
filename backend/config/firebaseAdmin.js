const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount;

// 1. Try to load from local JSON file first (Robust for Local Dev)
const localPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(localPath)) {
    console.log('📦 Loading Firebase Credentials from local JSON file...');
    serviceAccount = require(localPath);
} else {
    // 2. Fallback to Environment Variables (For Render / Production)
    console.log('🌐 Loading Firebase Credentials from environment variables...');

    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        // Remove quotes and handle escaped newlines
        privateKey = privateKey.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');

        const header = '-----BEGIN PRIVATE KEY-----';
        const footer = '-----END PRIVATE KEY-----';

        // Only add header/footer if absolutely missing
        if (!privateKey.includes(header)) privateKey = `${header}\n${privateKey}`;
        if (!privateKey.includes(footer)) privateKey = `${privateKey}\n${footer}`;

        // Final trim to ensure no trailing junk
        privateKey = privateKey.trim();
    }

    serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
    };
}

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

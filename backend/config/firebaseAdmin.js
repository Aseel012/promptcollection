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
        // 1. Strip outer quotes if any
        privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
        // 2. Replace literal escaped \n with real \n
        privateKey = privateKey.replace(/\\n/g, '\n');

        // 3. Ensure header/footer are present and on their own lines
        const header = '-----BEGIN PRIVATE KEY-----';
        const footer = '-----END PRIVATE KEY-----';

        if (!privateKey.includes(header)) privateKey = header + '\n' + privateKey;
        if (!privateKey.includes(footer)) privateKey = privateKey + '\n' + footer;

        // Final sanity check for PEM format
        if (privateKey.split('\n').length < 3) {
            // If still single line, force breaks after header and before footer
            privateKey = privateKey.replace(header, header + '\n').replace(footer, '\n' + footer);
        }
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
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin Initialized Successfully');
} catch (error) {
    console.error('❌ Firebase Admin Initialization FAILED:', error.message);
}

module.exports = admin;

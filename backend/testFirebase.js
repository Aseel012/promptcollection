const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('--- MINIMAL FIREBASE TEST ---');

let serviceAccount;
const localPath = path.join(__dirname, 'config', 'serviceAccountKey.json');

if (fs.existsSync(localPath)) {
    console.log('Found Local JSON:', localPath);
    serviceAccount = require(localPath);
    console.log('JSON Keys:', Object.keys(serviceAccount));
} else {
    console.log('Local JSON NOT FOUND at:', localPath);
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(__dirname, '.env') });
    serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '') : undefined,
    };
    console.log('Using Env Vars. Base Key Present:', !!process.env.FIREBASE_PRIVATE_KEY);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('SUCCESS: Firebase Admin Initialized');
} catch (error) {
    console.error('ERROR:', error);
}

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const pool = new Pool({
    connectionString: process.env.INSFORGE_POSTGRES_URL,
    max: 10
});

async function uploadBase64(base64String, folder, filename) {
    const matches = base64String.match(new RegExp('^data:(image/[a-zA-Z0-9]+);base64,(.+)$'));
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid Base64 format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const extension = mimeType.split('/')[1] || 'img';
    const filePath = `${folder}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

    const storageRef = ref(storage, filePath);

    const metadata = { contentType: mimeType };

    // Upload the file and metadata
    await uploadBytes(storageRef, buffer, metadata);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

async function migrateTable(tableName, nameColumn) {
    console.log(`\\n--- Migrating ${tableName} ---`);
    const client = await pool.connect();
    try {
        const { rows } = await client.query(`SELECT id, "${nameColumn}", image FROM ${tableName} WHERE image LIKE 'data:image/%'`);
        console.log(`Found ${rows.length} base64 images in ${tableName}`);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const name = row[nameColumn] || 'unnamed';
            console.log(`[${i + 1}/${rows.length}] ${name}`);

            try {
                const url = await uploadBase64(row.image, `migrated_${tableName}`, name);
                await client.query(`UPDATE ${tableName} SET image = $1 WHERE id = $2`, [url, row.id]);
                console.log(` ✅ Converted: ${url}`);
            } catch (err) {
                console.log(` ❌ Failed: ${err.message}`);
            }
        }
    } finally {
        client.release();
    }
}

async function run() {
    try {
        await migrateTable('categories', 'name');
        await migrateTable('prompts', 'title');
        console.log('\\nDone!');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
        process.exit(0);
    }
}

run();

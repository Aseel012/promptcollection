require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const admin = require('../config/firebaseAdmin');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');

let logOut = '';
function log(msg) {
    console.log(msg);
    logOut += msg + '\\n';
}

const pool = new Pool({
    connectionString: process.env.INSFORGE_POSTGRES_URL || 'postgresql://postgres:dc364af68ff3b138ba069d9119a25b55@6sbeyxbq.us-east.database.insforge.app:5432/insforge?sslmode=require',
    max: 10,
    idleTimeoutMillis: 30000
});

async function uploadBase64(base64String, folder, filename) {
    const bucket = getStorage().bucket();
    const matches = base64String.match(/^data:(image\\/\\w +); base64, (.+)$ /);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid Base64 string format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const extension = mimeType.split('/')[1] || 'img';
    const filePath = `${folder}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

    const file = bucket.file(filePath);
    await file.save(buffer, {
        metadata: { contentType: mimeType },
        public: true // Make file publicly readable
    });

    const bucketName = bucket.name;
    const encodedPath = encodeURIComponent(filePath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
}

async function migrateTable(tableName, nameColumn) {
    log(`\\n--- Migrating ${tableName} ---`);
    const client = await pool.connect();
    try {
        const { rows } = await client.query(`SELECT id, "${nameColumn}", image FROM ${tableName} WHERE image LIKE 'data:image/%'`);
        log(`Found ${rows.length} base64 images to migrate in ${tableName}`);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const name = row[nameColumn] || 'unnamed';
            log(`Processing [${i + 1}/${rows.length}]: ${name} (size: ${Math.round(row.image.length / 1024)} KB)`);

            try {
                const url = await uploadBase64(row.image, `migrated_${tableName}`, name);

                // Update Row
                await client.query(`UPDATE ${tableName} SET image = $1 WHERE id = $2`, [url, row.id]);
                log(` ✅ Converted to URL: ${url}`);
            } catch (err) {
                log(` ❌ Failed to migrate ${row.id}: ${err.message}`);
            }
        }
    } finally {
        client.release();
    }
}

async function run() {
    try {
        log('Starting Base64 to Firebase Migration...');
        await migrateTable('categories', 'name');
        await migrateTable('prompts', 'title');
        log('\\nMigration Complete!');
    } catch (error) {
        log('Fatal Migration Error: ' + error.stack);
    } finally {
        pool.end();
        fs.writeFileSync('migration_log.txt', logOut);
        process.exit(0);
    }
}

run();

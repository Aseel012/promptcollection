const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.INSFORGE_POSTGRES_URL,
});

async function run() {
    try {
        const client = await pool.connect();

        console.log("=== CHECKING CATEGORIES ===");
        const catRes = await client.query('SELECT id, name FROM categories');
        console.log(`Found ${catRes.rows.length} categories:`);
        console.table(catRes.rows);

        console.log("=== CHECKING PROMPTS ===");
        const promptRes = await client.query('SELECT id, title, category FROM prompts');
        console.log(`Found ${promptRes.rows.length} prompts.`);
        if (promptRes.rows.length > 0) {
            console.log("First 15 prompts:", promptRes.rows.slice(0, 15));
        }

        client.release();
        process.exit(0);
    } catch (error) {
        console.error("Database error:", error);
        process.exit(1);
    }
}

run();

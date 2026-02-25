const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// InsForge provides a PostgreSQL connection string
const pool = new Pool({
    connectionString: process.env.INSFORGE_POSTGRES_URL,
});

const initDb = async () => {
    const client = await pool.connect();
    try {
        console.log('--- INITIALIZING INSFORGE POSTGRESQL SCHEMA ---');

        // Users Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Users table ready');

        // Categories Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        image TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Categories table ready');

        // Engines Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS engines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        website TEXT,
        icon TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Engines table ready');

        // Prompts Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        prompt_text TEXT NOT NULL,
        tags JSONB DEFAULT '[]',
        category TEXT,
        ai_model TEXT,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Prompts table ready');

        console.log('✨ All tables initialized successfully');
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
};

initDb();

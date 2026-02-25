const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.INSFORGE_POSTGRES_URL,
});

const connectDB = async () => {
  try {
    console.log('--- DB CONNECTION ATTEMPT (INSFORGE POSTGRES) ---');

    const client = await pool.connect();
    console.log('✅ InsForge PostgreSQL Connected');

    // Test query
    const res = await client.query('SELECT NOW()');
    console.log('📡 Database Time:', res.rows[0].now);

    client.release();

  } catch (error) {
    console.error('❌ DATABASE CONNECTION FAILED');
    console.error('Error Message:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.error('🚨 ACTION REQUIRED: Database credentials are incorrect.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🚨 ACTION REQUIRED: Connection refused. Check if the database is running and accessible.');
    }
  }
};

module.exports = { connectDB, pool };


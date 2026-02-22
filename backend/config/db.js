const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('--- DB CONNECTION ATTEMPT ---');
    console.log('URI:', process.env.MONGO_URI ? 'SET (Hidden for security)' : 'NOT SET');

    // Disable command buffering globally so it fails fast if not connected
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB Connection Lost');
    });

  } catch (error) {
    console.error('❌ DATABASE CONNECTION FAILED');
    console.error('Error Message:', error.message);

    if (error.message.includes('IP address') || error.message.includes('whitelist')) {
      console.error('🚨 ACTION REQUIRED: Your IP is not whitelisted in MongoDB Atlas.');
    } else if (error.message.includes('ETIMEOUT')) {
      console.error('🚨 ACTION REQUIRED: Connection timed out. Check your internet or Atlas IP Access List.');
    }
  }
};

module.exports = connectDB;

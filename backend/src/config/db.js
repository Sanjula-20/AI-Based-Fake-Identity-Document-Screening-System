const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/identity_screening';
  
  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[Database] Connected to primary MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] Primary MongoDB unavailable (${error.message}). Initializing In-Memory Mongo Server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`[Database] Connected to In-Memory MongoDB instance at ${conn.connection.host}`);
    } catch (memErr) {
      console.error(`[Database] In-Memory MongoDB fallback failed: ${memErr.message}`);
    }
  }
};

module.exports = connectDB;

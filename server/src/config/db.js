const mongoose = require('mongoose');
const config = require('./env');
const repository = require('./repository');

const net = require('net');

function isMongoReachable(uri) {
  return new Promise((resolve) => {
    try {
      const match = uri.match(/mongodb:\/\/(?:[^:]+:[^@]+@)?([^/:]+)(?::(\d+))?/);
      const host = match ? match[1] : 'localhost';
      const port = match && match[2] ? parseInt(match[2], 10) : 27017;

      const socket = new net.Socket();
      socket.setTimeout(500);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    } catch (e) {
      resolve(false);
    }
  });
}

async function connectDatabase() {
  if (!config.mongoUri) {
    console.log('[Database] No MONGODB_URI provided. Running in IN-MEMORY database mode.');
    repository.setMode('memory');
    return { mode: 'memory', connected: true };
  }

  const isLocalhost = config.mongoUri.includes('localhost') || config.mongoUri.includes('127.0.0.1');

  if (isLocalhost && config.mongoUri.startsWith('mongodb://')) {
    const reachable = await isMongoReachable(config.mongoUri);
    if (!reachable) {
      console.log(`[Database] Local MongoDB not running on ${config.mongoUri}. Activating IN-MEMORY repository mode.`);
      repository.setMode('memory');
      return { mode: 'memory', connected: false };
    }
  }

  try {
    const isCloud = config.mongoUri.startsWith('mongodb+srv://');
    console.log(`[Database] Connecting to ${isCloud ? 'MongoDB Atlas (Cloud)' : 'MongoDB'}...`);
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 6000,
    });
    console.log('[Database] Connected to MongoDB successfully.');
    repository.setMode('mongo');
    return { mode: 'mongo', connected: true };
  } catch (err) {
    console.warn(`[Database] MongoDB connection error: ${err.message}. Falling back to IN-MEMORY repository mode.`);
    repository.setMode('memory');
    return { mode: 'memory', connected: false, error: err.message };
  }
}

module.exports = { connectDatabase };

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server root or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'neuroflow_secret_key_default_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.1:8b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },
  redisUrl: process.env.UPSTASH_REDIS_URL || '',
  seedSampleData: process.env.SEED_SAMPLE_DATA !== 'false',
  uploadsDir: path.resolve(__dirname, '../../uploads'),
};

module.exports = config;

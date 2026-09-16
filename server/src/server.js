const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/db');
const { seedDatabase } = require('./data/seed');

async function startServer() {
  try {
    // 1. Connect to DB (Mongo or In-Memory fallback)
    await connectDatabase();

    // 2. Seed demo user & initial sample data
    if (config.seedSampleData) {
      await seedDatabase();
    }

    // 3. Start Express HTTP Server
    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 NeuroFlow AI Server is running on port ${config.port}`);
      console.log(`📡 API Base: http://localhost:${config.port}/api`);
      console.log(`💚 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`====================================================`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('HTTP Server closed.');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Fatal Server Startup Error:', err);
    process.exit(1);
  }
}

startServer();

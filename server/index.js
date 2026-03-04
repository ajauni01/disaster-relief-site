const app = require('./src/app');
const config = require('./src/config/env');
const { connectDatabase } = require('./src/config/db');
const { seedIfNeeded } = require('./src/data/seedData');

async function startServer() {
  try {
    await connectDatabase(config.mongoUri);
    await seedIfNeeded();

    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Startup failure:', error.message);
    process.exit(1);
  }
}

startServer();

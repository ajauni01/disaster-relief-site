const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wayne_relief_hub',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'replace-this-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '8h',
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase(),
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || ''
};

module.exports = config;

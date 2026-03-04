const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/env');

const dashboardRoutes = require('./routes/dashboardRoutes');
const alertRoutes = require('./routes/alertRoutes');
const updateRoutes = require('./routes/updateRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const helpRequestRoutes = require('./routes/helpRequestRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const donationRoutes = require('./routes/donationRoutes');
const siteInfoRoutes = require('./routes/siteInfoRoutes');
const adminAuthRoutes = require('./routes/admin/authRoutes');
const adminOverviewRoutes = require('./routes/admin/overviewRoutes');
const adminHelpRequestRoutes = require('./routes/admin/helpRequestRoutes');
const adminVolunteerRoutes = require('./routes/admin/volunteerRoutes');
const adminInventoryRoutes = require('./routes/admin/inventoryRoutes');
const adminCmsRoutes = require('./routes/admin/cmsRoutes');
const adminAnalyticsRoutes = require('./routes/admin/analyticsRoutes');
const adminUserRoutes = require('./routes/admin/userRoutes');
const { requireAuth } = require('./middleware/auth');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

const allowedOrigins = config.clientOrigin
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

const clientDir = path.resolve(__dirname, '../../client');
app.use(express.static(clientDir));

app.get('/api/health', (req, res) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbReadyState = mongoose.connection.readyState;
  const database = states[dbReadyState] || 'unknown';
  const isConnected = dbReadyState === 1;

  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    status: isConnected ? 'OK' : 'DEGRADED',
    database
  });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/site-info', siteInfoRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/overview', requireAuth, adminOverviewRoutes);
app.use('/api/admin/help-requests', requireAuth, adminHelpRequestRoutes);
app.use('/api/admin/volunteers', requireAuth, adminVolunteerRoutes);
app.use('/api/admin/inventory', requireAuth, adminInventoryRoutes);
app.use('/api/admin/cms', requireAuth, adminCmsRoutes);
app.use('/api/admin/analytics', requireAuth, adminAnalyticsRoutes);
app.use('/api/admin', requireAuth, adminUserRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(clientDir, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;

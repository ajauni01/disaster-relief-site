const bcrypt = require('bcryptjs');

const config = require('../config/env');
const Alert = require('../models/Alert');
const StatusTile = require('../models/StatusTile');
const Update = require('../models/Update');
const Shelter = require('../models/Shelter');
const Resource = require('../models/Resource');
const InventoryResource = require('../models/InventoryResource');
const SiteContent = require('../models/SiteContent');
const AdminUser = require('../models/AdminUser');

const seedPayload = {
  alerts: [
    {
      type: 'Severe Thunderstorm Warning',
      severity: 'high',
      issuedTime: '2:45 PM',
      validUntil: '5:30 PM',
      status: 'active'
    }
  ],
  statusTiles: [
    { label: 'Power Status', value: 'Stable', status: 'good', icon: 'zap', displayOrder: 1 },
    { label: 'Roads', value: 'Open', status: 'good', icon: 'map', displayOrder: 2 },
    { label: 'Weather', value: 'Severe Risk', status: 'warning', icon: 'alert', displayOrder: 3 },
    { label: 'Shelters', value: '2 Open', status: 'info', icon: 'shelter', displayOrder: 4 },
    { label: 'Food Support', value: '1 Active', status: 'info', icon: 'food', displayOrder: 5 },
    { label: 'Medical', value: 'Hospital Open', status: 'good', icon: 'medical', displayOrder: 6 }
  ],
  updates: [
    {
      title: 'Community Center Shelter Now Open',
      category: 'shelter',
      timestampLabel: '2 hours ago',
      snippet: 'The Community Center is accepting residents with capacity for up to 200 people.'
    },
    {
      title: 'Road Closure: Main St & 4th Ave',
      category: 'closure',
      timestampLabel: '3 hours ago',
      snippet: 'Temporary closure due to storm damage assessment. Use alternate routes.'
    },
    {
      title: 'Food Distribution Event',
      category: 'food',
      timestampLabel: '4 hours ago',
      snippet: 'Free meal distribution at Fountain Park, 2 PM - 6 PM today.'
    },
    {
      title: 'Volunteer Sign-ups Now Open',
      category: 'volunteer',
      timestampLabel: '5 hours ago',
      snippet: 'We need medical personnel, cleanup crews, and logistics support.'
    }
  ],
  shelters: [
    {
      name: 'Wayne Community Center',
      address: '123 Main St, Wayne, NE',
      capacity: 200,
      occupancy: 145,
      isOpen: true
    },
    {
      name: 'Wayne High School Gym',
      address: '611 W 7th St, Wayne, NE',
      capacity: 150,
      occupancy: 81,
      isOpen: true
    }
  ],
  resources: [
    {
      title: 'Tornado Safety',
      description: 'What to do before, during, and after a tornado warning.',
      type: 'preparedness'
    },
    {
      title: 'Flood Safety',
      description: 'Flood planning and evacuation safety guidance for families.',
      type: 'preparedness'
    },
    {
      title: 'Winter Storm Guide',
      description: 'How to prepare homes and emergency kits for winter events.',
      type: 'preparedness'
    },
    {
      title: 'Power Outage Prep',
      description: 'Generator use, food storage, and communication backup tips.',
      type: 'preparedness'
    }
  ],
  inventory: [
    { name: 'Bottled Water', category: 'Supplies', quantity: 180, location: 'Warehouse A', lowStockThreshold: 40 },
    { name: 'Emergency Blankets', category: 'Shelter', quantity: 95, location: 'Warehouse B', lowStockThreshold: 25 },
    { name: 'First Aid Kits', category: 'Medical', quantity: 34, location: 'Medical Depot', lowStockThreshold: 20 },
    { name: 'Non-Perishable Meals', category: 'Food', quantity: 140, location: 'Food Storage', lowStockThreshold: 50 }
  ],
  siteContent: {
    singletonKey: 'site-content',
    emergencyMessage: 'Emergency? Call 911',
    hotlineNumbers: ['911', '(402) 375-2660'],
    announcements: [
      {
        title: 'Shelter Intake Open',
        body: 'Wayne Community Center is currently open for overnight shelter intake.',
        published: true
      }
    ]
  }
};

async function seedCollectionIfEmpty(model, payload) {
  const count = await model.countDocuments();
  if (count === 0 && Array.isArray(payload) && payload.length) {
    await model.insertMany(payload);
  }
}

async function seedSiteContentIfMissing() {
  const doc = await SiteContent.findOne({ singletonKey: 'site-content' });
  if (!doc) {
    await SiteContent.create(seedPayload.siteContent);
  }
}

async function ensureSuperAdminFromEnv() {
  if (!config.superAdminEmail) {
    console.warn('[seed] SUPER_ADMIN_EMAIL is not configured; skipping super admin bootstrap.');
    return;
  }

  if (!config.superAdminPassword) {
    console.warn('[seed] SUPER_ADMIN_PASSWORD is not configured; skipping super admin bootstrap.');
    return;
  }

  const existing = await AdminUser.findOne({ email: config.superAdminEmail });
  const passwordHash = await bcrypt.hash(config.superAdminPassword, 12);

  if (!existing) {
    await AdminUser.create({
      email: config.superAdminEmail,
      passwordHash,
      role: 'super-admin',
      isActive: true
    });
    return;
  }

  let shouldSave = false;
  if (existing.role !== 'super-admin') {
    existing.role = 'super-admin';
    shouldSave = true;
  }
  if (!existing.isActive) {
    existing.isActive = true;
    shouldSave = true;
  }

  const hasValidPassword = await bcrypt.compare(config.superAdminPassword, existing.passwordHash);
  if (!hasValidPassword) {
    existing.passwordHash = passwordHash;
    shouldSave = true;
  }

  if (shouldSave) {
    await existing.save();
  }
}

async function seedIfNeeded() {
  await Promise.all([
    seedCollectionIfEmpty(Alert, seedPayload.alerts),
    seedCollectionIfEmpty(StatusTile, seedPayload.statusTiles),
    seedCollectionIfEmpty(Update, seedPayload.updates),
    seedCollectionIfEmpty(Shelter, seedPayload.shelters),
    seedCollectionIfEmpty(Resource, seedPayload.resources),
    seedCollectionIfEmpty(InventoryResource, seedPayload.inventory),
    seedSiteContentIfMissing(),
    ensureSuperAdminFromEnv()
  ]);
}

module.exports = { seedIfNeeded };

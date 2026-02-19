const Donation = require('../models/Donation');

function validateDonation(body) {
  const required = ['name', 'email', 'amount'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      const error = new Error(`Invalid or missing field: ${field}`);
      error.statusCode = 400;
      throw error;
    }
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error('Donation amount must be a positive number');
    error.statusCode = 400;
    throw error;
  }
}

async function createDonation(req, res) {
  validateDonation(req.body);

  const donation = await Donation.create({
    name: String(req.body.name).trim(),
    email: String(req.body.email).trim(),
    amount: Number(req.body.amount),
    message: req.body.message ? String(req.body.message).trim() : ''
  });

  res.status(201).json({ success: true, data: donation });
}

async function listDonations(req, res) {
  const donations = await Donation.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: donations });
}

module.exports = { createDonation, listDonations };

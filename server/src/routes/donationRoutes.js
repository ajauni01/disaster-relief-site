const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { createDonation, listDonations } = require('../controllers/donationController');

const router = express.Router();

router.get('/', asyncHandler(listDonations));
router.post('/', asyncHandler(createDonation));

module.exports = router;

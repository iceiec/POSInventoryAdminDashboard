const express = require('express');
const { getSummary } = require('../controllers/analyticsController');

const router = express.Router();

// GET /api/analytics/summary?startDate=2024-01-01&endDate=2024-01-31
router.get('/summary', getSummary);

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(dashboardController.getDashboard));

module.exports = router;

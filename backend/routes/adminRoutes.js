const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.get('/stats', adminAuth, getDashboardStats);

module.exports = router;

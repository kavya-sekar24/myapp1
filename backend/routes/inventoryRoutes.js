const express = require('express');
const router = express.Router();
const { getInventory, updateInventory } = require('../controllers/inventoryController');
const { adminAuth } = require('../middleware/auth');

router.get('/', adminAuth, getInventory);
router.put('/:id', adminAuth, updateInventory);

module.exports = router;

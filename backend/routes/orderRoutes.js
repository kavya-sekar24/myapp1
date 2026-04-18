const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getAllOrders, updateOrderStatus, createRazorpayOrder } = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/', auth, createOrder);
router.post('/razorpay', auth, createRazorpayOrder);
router.get('/my', auth, getUserOrders);
router.get('/all', adminAuth, getAllOrders);
router.patch('/:id/status', adminAuth, updateOrderStatus);

module.exports = router;

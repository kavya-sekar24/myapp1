const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, getAllBookings, updateBookingStatus, getAvailability } = require('../controllers/bookingController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/availability', getAvailability); // Public check
router.post('/', auth, createBooking);
router.get('/my', auth, getUserBookings);
router.get('/all', adminAuth, getAllBookings);
router.patch('/:id/status', adminAuth, updateBookingStatus);

module.exports = router;

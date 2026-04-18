const mongoose = require('mongoose');
require('dotenv').config();
const Booking = require('./models/Booking');

async function checkRecentBooking() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const booking = await Booking.findOne().sort({ updatedAt: -1 });
        console.log('--- DATA ---');
        console.log('Status:', booking?.booking_status);
        console.log('Date:', booking?.booking_date);
        console.log('--- END ---');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkRecentBooking();

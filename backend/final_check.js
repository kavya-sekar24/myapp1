const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');
const Booking = require('./models/Booking');

async function finalCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const booking = await Booking.findOne({ booking_date: new Date('2026-03-25T00:00:00.000Z') });
        const order = await Order.findOne({ _id: '69b5292293f859ff6422543c' });

        console.log(`BOOKING_STATUS: ${booking?.booking_status}`);
        console.log(`ORDER_STATUS: ${order?.order_status}`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

finalCheck();

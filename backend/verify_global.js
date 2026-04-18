const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');
const Booking = require('./models/Booking');

async function verifyGlobalFixed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find the specific booking for 3/25
        const booking = await Booking.findOne({
            booking_date: { $gte: new Date('2026-03-25T00:00:00.000Z'), $lt: new Date('2026-03-26T00:00:00.000Z') }
        });

        // Find the most recently updated order
        const order = await Order.findOne({}).sort({ updatedAt: -1 });

        console.log('GLOBAL_VERIFICATION_START');
        console.log('Booking 3/25 Status:', booking?.booking_status);
        console.log('Recent Order ID:', order?._id);
        console.log('Recent Order Status:', order?.order_status);
        console.log('GLOBAL_VERIFICATION_END');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verifyGlobalFixed();

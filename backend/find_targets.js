const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');
const Booking = require('./models/Booking');

async function findTargets() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const order = await Order.findOne({ order_status: 'Processing' });
        const booking = await Booking.findOne({ booking_status: 'Pending' });

        console.log('TARGETS_START');
        console.log('Order ID:', order?._id);
        console.log('Booking ID:', booking?._id);
        console.log('TARGETS_END');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

findTargets();

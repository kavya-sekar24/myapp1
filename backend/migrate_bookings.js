
const mongoose = require('mongoose');
require('dotenv').config();
const Booking = require('./models/Booking');

async function fixBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const bookings = await Booking.find({ yardName: { $exists: false } });
        console.log(`Found ${bookings.length} bookings without yardName`);

        for (const b of bookings) {
            // Default to 'Primary Mill Floor' if it's 1 acre, otherwise choose based on area
            if (b.areaSize === 1) b.yardName = 'Primary Mill Floor';
            else if (b.areaSize === 0.5) b.yardName = 'Farmer Collective Space';
            else b.yardName = 'Heritage Small Yard';
            
            await b.save();
            console.log(`Updated booking ${b._id} with yardName: ${b.yardName}`);
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixBookings();

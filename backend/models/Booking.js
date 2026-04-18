const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking_date: { type: Date, required: true },
    time_slot: { type: String, required: true },
    booking_status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    areaSize: { type: Number }, // keeping for UI
    yardName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

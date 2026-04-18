const Booking = require('../models/Booking');

exports.createBooking = async (req, res) => {
    try {
        const { booking_date, time_slot, areaSize, yardName } = req.body;

        // Double Booking Prevention per Yard
        const existing = await Booking.findOne({
            booking_date: new Date(booking_date),
            time_slot,
            yardName,
            booking_status: { $ne: 'Rejected' }
        });

        if (existing) {
            return res.status(400).json({ message: `The ${yardName} is already booked for this date.` });
        }

        const booking = new Booking({
            user: req.user.id,
            booking_date,
            time_slot,
            areaSize,
            yardName,
            booking_status: 'Pending'
        });

        await booking.save();
        res.status(201).json({ message: 'Booking created successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user', 'name email phone_number').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { booking_status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { booking_status }, { new: true });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            booking_date: { $gte: startOfDay, $lte: endOfDay },
            booking_status: { $ne: 'Rejected' }
        }).select('yardName booking_status');

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total_amount: { type: Number, required: true },
    payment_status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    order_status: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String
    },
    paymentDetails: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

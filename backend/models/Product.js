const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock_quantity: { type: Number, default: 0 },
    image_url: { type: String },
    // Keeping sizes/benefits for UI compatibility as requested not to change UI
    sizes: [{ type: String }],
    benefits: [{ type: String }],
    itemType: { type: String, enum: ['sale', 'rental'], default: 'sale' },
    status: { type: String, default: 'Available' },
    rentalPeriod: { type: String },
    specs: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

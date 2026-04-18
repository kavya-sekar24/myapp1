const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    available_stock: { type: Number, required: true },
    minimum_stock_level: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);

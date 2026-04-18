const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

exports.getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find().populate('product');
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateInventory = async (req, res) => {
    try {
        const { available_stock, minimum_stock_level } = req.body;
        const inventory = await Inventory.findById(req.params.id);
        if (!inventory) return res.status(404).json({ message: 'Inventory record not found' });

        inventory.available_stock = available_stock;
        if (minimum_stock_level) inventory.minimum_stock_level = minimum_stock_level;
        await inventory.save();

        // Sync back to Product table
        const product = await Product.findById(inventory.product);
        if (product) {
            product.stock_quantity = available_stock;
            await product.save();
        }

        res.json(inventory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

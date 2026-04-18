const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const result = await Product.deleteMany({
            $or: [
                { product_name: 'mm' },
                { product_name: /test/i },
                { product_name: '' }
            ]
        });
        console.log(`Deleted ${result.deletedCount} junk items.`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanup();

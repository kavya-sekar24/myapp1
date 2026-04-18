const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const sulphurOil = await Product.findOne({ product_name: 'Cold Pressed Coconut Oil (With Sulphur)' });
        const testAsset = await Product.findOne({ product_name: 'Manual Test Asset' });

        console.log('VERIFICATION_START');
        console.log('Sulphur Oil Stock:', sulphurOil.stock_quantity);
        console.log('Manual Test Asset Found:', !!testAsset);
        console.log('Manual Test Asset Stock:', testAsset?.stock_quantity);
        console.log('VERIFICATION_END');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verify();

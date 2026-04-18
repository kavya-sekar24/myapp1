const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function snapshot() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const products = await Product.find({}, { product_name: 1, stock_quantity: 1 });
        console.log('SNAPSHOT_START');
        console.log(JSON.stringify(products, null, 2));
        console.log('SNAPSHOT_END');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

snapshot();

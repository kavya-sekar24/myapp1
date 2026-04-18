const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const mmItem = await Product.findOne({ $or: [{ product_name: 'mm' }, { name: 'mm' }] });
        if (mmItem) {
            console.log('Found mm item:');
            console.log(JSON.stringify(mmItem, null, 2));
        } else {
            console.log('No mm item found in database.');
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDB();

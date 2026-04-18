const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function checkDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({});
    console.log(JSON.stringify(products, null, 2));
    process.exit();
}

checkDB();

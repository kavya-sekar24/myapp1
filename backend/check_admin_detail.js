const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkAdminDetail() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ email: 'kavyasekar0099@gmail.com' });
        console.log(JSON.stringify(users, null, 2));
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAdminDetail();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'kavyasekar0099@gmail.com' });
        if (user) {
            console.log('User found:');
            console.log('Name:', user.name);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            // We can't see the password directly due to hashing usually, but we can verify the role.
        } else {
            console.log('User kavyasekar0099@gmail.com not found in database.');
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAdmin();

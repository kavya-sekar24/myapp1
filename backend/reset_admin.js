const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'kavyasekar0099@gmail.com' });
        if (user) {
            user.password = 'adminpassword123';
            user.role = 'ADMIN';
            await user.save();
            console.log('Admin user password reset to adminpassword123');
        } else {
            const admin = new User({
                name: 'Kavya Admin',
                email: 'kavyasekar0099@gmail.com',
                password: 'adminpassword123',
                role: 'ADMIN'
            });
            await admin.save();
            console.log('Admin user created with password adminpassword123');
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

resetAdmin();

const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ email: 'kavyasekar0099@gmail.com' });
        if (existingAdmin) {
            // If exists, just update role to ADMIN
            existingAdmin.role = 'ADMIN';
            await existingAdmin.save();
            console.log('Existing user upgraded to ADMIN!');
            process.exit(0);
        }

        const admin = new User({
            name: 'Kavya Admin',
            email: 'kavyasekar0099@gmail.com',
            password: 'adminpassword123',
            phone_number: '9999999999',
            address: 'Mill Headquarters',
            role: 'ADMIN'
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@mill.com');
        console.log('Password: adminpassword123');
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createAdmin();

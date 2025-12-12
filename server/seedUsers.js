const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Clear existing users
        await User.deleteMany({});
        console.log('Existing users cleared');

        // Prepare users with hashed passwords
        const salt = await bcrypt.genSalt(10);

        const adminPassword = await bcrypt.hash('admin', salt);
        const auxPassword = await bcrypt.hash('aux', salt);
        const chefPassword = await bcrypt.hash('chef', salt);

        const users = [
            {
                name: 'Administracion',
                email: 'admin@costeo.com',
                password: adminPassword,
                role: 'admin',
                permissions: []
            },
            {
                name: 'aux. administrativo',
                email: 'aux@costeo.com',
                password: auxPassword,
                role: 'viewer',
                permissions: []
            },
            {
                name: 'chef',
                email: 'chef@costeo.com',
                password: chefPassword,
                role: 'chef',
                permissions: []
            }
        ];

        // Insert new users using insertMany (bypasses pre-save hooks)
        await User.insertMany(users);
        console.log('Users seeded successfully:');
        users.forEach(u => console.log(`- ${u.name} (${u.role})`));

        process.exit();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedUsers();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const users = [
    {
        name: 'Administracion',
        email: 'admin@costeo.com',
        password: 'admin',
        role: 'admin',
        permissions: []
    },
    {
        name: 'aux. administrativo',
        email: 'aux@costeo.com',
        password: 'aux',
        role: 'viewer',
        permissions: []
    },
    {
        name: 'chef',
        email: 'chef@costeo.com',
        password: 'chef',
        role: 'chef',
        permissions: []
    }
];

const seedUsers = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Clear existing users
        await User.deleteMany({});
        console.log('Existing users cleared');

        // Insert new users
        await User.insertMany(users);
        console.log('Users seeded successfully:');
        users.forEach(u => console.log(`- ${u.name} (${u.role})`));

        process.exit();
    } catch (error) {
        console.error('Connection Error:', error);
        process.exit(1);
    }
};

seedUsers();

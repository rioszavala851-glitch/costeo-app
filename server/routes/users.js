const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorizeRole } = require('../middleware/auth');

// Protect all routes: Only Admins can manage users
router.use(auth, authorizeRole(['admin']));

// @route   GET /api/users
// @desc    Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/users
// @desc    Register a new user
router.post('/', async (req, res) => {
    const { name, email, password, role, permissions } = req.body;

    // Simple check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // In a real app, hash password here using bcrypt
    const user = new User({
        name,
        email,
        password, // TODO: Hash this
        role,
        permissions
    });

    try {
        const newUser = await user.save();
        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user permissions/role
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.name) user.name = req.body.name;
        if (req.body.role) user.role = req.body.role;
        if (req.body.permissions) user.permissions = req.body.permissions;

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

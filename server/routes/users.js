const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const { auth, authorizeRole } = require('../middleware/auth');
const { PLAN_LIMITS } = require('../middleware/planLimits');

// Protect all routes: Only Admins can manage users
router.use(auth, authorizeRole(['admin']));

// @route   GET /api/users
// @desc    Get all users with their recipe counts
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').lean();

        // Get recipe counts for each user
        const usersWithCounts = await Promise.all(users.map(async (user) => {
            const recipeCount = await Recipe.countDocuments({ createdBy: user._id });
            const planLimits = PLAN_LIMITS[user.plan || 'free'];

            return {
                ...user,
                recipeCount,
                recipeLimit: planLimits.maxRecipes,
                recipePercentage: planLimits.maxRecipes === Infinity
                    ? 0
                    : Math.round((recipeCount / planLimits.maxRecipes) * 100)
            };
        }));

        res.json(usersWithCounts);
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

// @route   PUT /api/users/:id/password
// @desc    Change user password (Admin only)
router.put('/:id/password', async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 4 caracteres' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Set new password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Error al cambiar contraseña' });
    }
});

// @route   PUT /api/users/:id/plan
// @desc    Change user plan (Admin only) - For premium upgrades
router.put('/:id/plan', async (req, res) => {
    try {
        const { plan } = req.body;

        if (!['free', 'premium'].includes(plan)) {
            return res.status(400).json({ message: 'Plan inválido. Use "free" o "premium"' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.plan = plan;

        // Set premium dates if upgrading
        if (plan === 'premium') {
            user.premiumStartDate = new Date();
            user.premiumEndDate = null; // Or set expiration date for subscriptions
        } else {
            user.premiumStartDate = null;
            user.premiumEndDate = null;
        }

        await user.save();

        res.json({
            message: `Plan actualizado a ${plan === 'premium' ? 'Premium' : 'Gratuito'}`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                premiumStartDate: user.premiumStartDate
            }
        });
    } catch (err) {
        console.error('Error changing plan:', err);
        res.status(500).json({ message: 'Error al cambiar plan' });
    }
});

module.exports = router;

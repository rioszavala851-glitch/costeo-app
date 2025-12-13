const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getPlanStatus } = require('../middleware/planLimits');

// Validation rules for login
const loginValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 4 }).withMessage('Password must be at least 4 characters')
];

// @route   POST /api/auth/login
// @desc    Login user and return token
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                plan: user.plan || 'free'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Save active session token for single-device enforcement (free users)
        user.activeSessionToken = token;
        user.activeSessionCreatedAt = new Date();
        await user.save();

        // Get plan status
        const planStatus = await getPlanStatus(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                plan: user.plan || 'free'
            },
            planStatus
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/plan-status
// @desc    Get current user's plan status and limits
router.get('/plan-status', auth, async (req, res) => {
    try {
        const planStatus = await getPlanStatus(req.user.id);
        if (!planStatus) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(planStatus);
    } catch (err) {
        console.error('Error getting plan status:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/verify
// @desc    Verify token
router.post('/verify', auth, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// @route   POST /api/auth/logout
// @desc    Logout user and clear session
router.post('/logout', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.activeSessionToken = null;
            user.activeSessionCreatedAt = null;
            await user.save();
        }
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

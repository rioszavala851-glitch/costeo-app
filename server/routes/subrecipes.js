const express = require('express');
const router = express.Router();
const SubRecipe = require('../models/SubRecipe');
const { auth, authorizeRole } = require('../middleware/auth');

// @route   GET /api/subrecipes
// @desc    Get all subrecipes (Authenticated users)
router.get('/', auth, async (req, res) => {
    try {
        const subrecipes = await SubRecipe.find().populate('items.item');
        res.json(subrecipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/subrecipes
// @desc    Create a subrecipe (Admin & Chef)
router.post('/', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    const subRecipe = new SubRecipe(req.body);
    try {
        const newSubRecipe = await subRecipe.save();
        res.status(201).json(newSubRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

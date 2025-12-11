const express = require('express');
const router = express.Router();
const SubRecipe = require('../models/SubRecipe');

// @route   GET /api/subrecipes
router.get('/', async (req, res) => {
    try {
        const subrecipes = await SubRecipe.find().populate('items.item');
        res.json(subrecipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/subrecipes
router.post('/', async (req, res) => {
    const subRecipe = new SubRecipe(req.body);
    try {
        const newSubRecipe = await subRecipe.save();
        res.status(201).json(newSubRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

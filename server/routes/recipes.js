const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const { auth, authorizeRole } = require('../middleware/auth');

// @route   GET /api/recipes
// @desc    Get all recipes (Authenticated users)
router.get('/', auth, async (req, res) => {
    try {
        const recipes = await Recipe.find().populate('items.item');
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/recipes
// @desc    Create a recipe (Admin & Chef)
router.post('/', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    const recipe = new Recipe(req.body);
    try {
        const newRecipe = await recipe.save();
        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

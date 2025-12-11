const express = require('express');
const router = express.Router();
const CloudRecipe = require('../models/CloudRecipe');

// @route   GET /api/cloud-recipes
// @desc    Get all cloud recipes
router.get('/', async (req, res) => {
    try {
        const recipes = await CloudRecipe.find().populate('uploadedBy', 'name');
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/cloud-recipes
// @desc    Upload a recipe to cloud
router.post('/', async (req, res) => {
    const recipe = new CloudRecipe(req.body);
    try {
        const newRecipe = await recipe.save();
        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

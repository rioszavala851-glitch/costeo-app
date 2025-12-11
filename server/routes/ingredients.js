const express = require('express');
const router = express.Router();
const Ingredient = require('../models/Ingredient');

// @route   GET /api/ingredients
// @desc    Get all ingredients
router.get('/', async (req, res) => {
    try {
        const ingredients = await Ingredient.find();
        res.json(ingredients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/ingredients
// @desc    Create an ingredient
router.post('/', async (req, res) => {
    const ingredient = new Ingredient({
        name: req.body.name,
        unit: req.body.unit,
        cost: req.body.cost,
        yield: req.body.yield,
        isSubRecipe: false
    });

    try {
        const newIngredient = await ingredient.save();
        res.status(201).json(newIngredient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

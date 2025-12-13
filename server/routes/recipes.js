const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const { auth, authorizeRole } = require('../middleware/auth');
const { checkRecipeLimit, PLAN_LIMITS } = require('../middleware/planLimits');

// @route   GET /api/recipes
// @desc    Get all recipes (Authenticated users)
router.get('/', auth, async (req, res) => {
    try {
        const recipes = await Recipe.find().populate('items.item');

        // Add recipe limit info to response for frontend
        const user = req.user;
        const planLimits = PLAN_LIMITS[user.plan || 'free'];
        const recipeCount = await Recipe.countDocuments();

        res.json({
            recipes,
            limits: {
                max: planLimits.maxRecipes,
                current: recipeCount,
                remaining: Math.max(0, planLimits.maxRecipes - recipeCount),
                isPremium: user.plan === 'premium'
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/recipes
// @desc    Create a recipe (Admin & Chef) - WITH LIMIT CHECK
router.post('/', auth, authorizeRole(['admin', 'chef']), checkRecipeLimit, async (req, res) => {
    const recipe = new Recipe(req.body);
    try {
        const newRecipe = await recipe.save();
        res.status(201).json({
            recipe: newRecipe,
            recipeLimit: req.recipeLimit
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/recipes/:id
// @desc    Update a recipe
router.put('/:id', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!recipe) return res.status(404).json({ message: 'Receta no encontrada' });
        res.json(recipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete a recipe
router.delete('/:id', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Receta no encontrada' });
        res.json({ message: 'Receta eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

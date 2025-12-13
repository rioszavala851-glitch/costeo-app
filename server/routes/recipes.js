const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { auth, authorizeRole } = require('../middleware/auth');
const { checkRecipeLimit, PLAN_LIMITS, getUserRecipeCount } = require('../middleware/planLimits');
const { validateRecipe } = require('../middleware/validators/recipeValidator');

// @route   GET /api/recipes
// @desc    Get all recipes (Authenticated users) - Shows all org recipes but counts per user
// @route   GET /api/recipes
// @desc    Get all recipes (Authenticated users) - Supports pagination
router.get('/', auth, async (req, res) => {
    try {
        const user = req.user;

        let query = Recipe.find();
        let total = await Recipe.countDocuments();

        // Pagination Logic
        if (req.query.page && req.query.limit) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            query = query.skip(skip).limit(limit);
        }

        // Get recipes (with populated items)
        const recipes = await query
            .populate('items.item')
            .populate('createdBy', 'name email');

        // Count recipes BY THIS USER for limit tracking
        const planLimits = PLAN_LIMITS[user.plan || 'free'];
        const userRecipeCount = await Recipe.countDocuments({ createdBy: user.id });

        res.json({
            recipes,
            limits: {
                max: planLimits.maxRecipes,
                current: userRecipeCount,
                remaining: Math.max(0, planLimits.maxRecipes - userRecipeCount),
                isPremium: user.plan === 'premium'
            },
            pagination: req.query.page ? {
                page: parseInt(req.query.page),
                limit: parseInt(req.query.limit),
                total,
                pages: Math.ceil(total / (parseInt(req.query.limit) || 20))
            } : null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/recipes
// @desc    Create a recipe (Admin & Chef) - WITH LIMIT CHECK per user
router.post('/', auth, authorizeRole(['admin', 'chef']), checkRecipeLimit, validateRecipe, async (req, res) => {
    try {
        // Automatically assign the creator
        const recipeData = {
            ...req.body,
            createdBy: req.user.id
        };

        const recipe = new Recipe(recipeData);
        const newRecipe = await recipe.save();

        // Update user's currentRecipeCount
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { currentRecipeCount: 1 }
        });

        // Populate the creator info
        await newRecipe.populate('createdBy', 'name email');

        res.status(201).json({
            recipe: newRecipe,
            recipeLimit: req.recipeLimit
        });
    } catch (err) {
        console.error('Error creating recipe:', err);
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/recipes/:id
// @desc    Update a recipe (owner or admin only)
router.put('/:id', auth, authorizeRole(['admin', 'chef']), validateRecipe, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Receta no encontrada' });

        // Check if user is owner or admin
        const isOwner = recipe.createdBy?.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permiso para editar esta receta' });
        }

        // Don't allow changing the owner
        const { createdBy, ...updateData } = req.body;

        const updatedRecipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('createdBy', 'name email');

        res.json(updatedRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete a recipe (owner or admin only)
router.delete('/:id', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Receta no encontrada' });

        // Check if user is owner or admin
        const isOwner = recipe.createdBy?.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta receta' });
        }

        // Get the owner ID before deleting
        const ownerId = recipe.createdBy;

        await Recipe.findByIdAndDelete(req.params.id);

        // Update owner's currentRecipeCount
        if (ownerId) {
            await User.findByIdAndUpdate(ownerId, {
                $inc: { currentRecipeCount: -1 }
            });
        }

        res.json({ message: 'Receta eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/recipes/my-count
// @desc    Get count of recipes for current user
router.get('/my-count', auth, async (req, res) => {
    try {
        const count = await getUserRecipeCount(req.user.id);
        const planLimits = PLAN_LIMITS[req.user.plan || 'free'];

        res.json({
            count,
            limit: planLimits.maxRecipes,
            remaining: Math.max(0, planLimits.maxRecipes - count),
            percentage: planLimits.maxRecipes === Infinity ? 0 : Math.round((count / planLimits.maxRecipes) * 100)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

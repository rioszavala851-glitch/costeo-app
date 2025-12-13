const express = require('express');
const router = express.Router();
const SubRecipe = require('../models/SubRecipe');
const { auth, authorizeRole } = require('../middleware/auth');
const { validateSubRecipe } = require('../middleware/validators/subRecipeValidator');

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
router.post('/', auth, authorizeRole(['admin', 'chef']), validateSubRecipe, async (req, res) => {
    const subRecipe = new SubRecipe(req.body);
    try {
        const newSubRecipe = await subRecipe.save();
        res.status(201).json(newSubRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/subrecipes/:id
// @desc    Update a subrecipe
router.put('/:id', auth, authorizeRole(['admin', 'chef']), validateSubRecipe, async (req, res) => {
    try {
        const subRecipe = await SubRecipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!subRecipe) return res.status(404).json({ message: 'Sub-receta no encontrada' });
        res.json(subRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/subrecipes/:id
// @desc    Delete a subrecipe
router.delete('/:id', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    try {
        const subRecipe = await SubRecipe.findByIdAndDelete(req.params.id);
        if (!subRecipe) return res.status(404).json({ message: 'Sub-receta no encontrada' });
        res.json({ message: 'Sub-receta eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

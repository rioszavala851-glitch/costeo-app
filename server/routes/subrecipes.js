const express = require('express');
const router = express.Router();
const SubRecipe = require('../models/SubRecipe');
const { auth, authorizeRole } = require('../middleware/auth');
const { validateSubRecipe } = require('../middleware/validators/subRecipeValidator');
const { parsePaginationParams, buildPaginationMeta, applyPagination, buildSearchFilter } = require('../utils/pagination');

// @route   GET /api/subrecipes
// @desc    Get all subrecipes (Authenticated users) - Supports pagination
router.get('/', auth, async (req, res) => {
    try {
        const pagination = parsePaginationParams(req.query, {
            defaultLimit: 50,
            defaultSort: { name: 1 }
        });

        // Build search filter
        const searchFilter = buildSearchFilter(pagination.search, ['name']);

        // Get total count
        const total = await SubRecipe.countDocuments(searchFilter);

        // Check if pagination is requested
        if (req.query.page || req.query.limit) {
            const query = applyPagination(
                SubRecipe.find(searchFilter).populate('items.item'),
                pagination
            );
            const subrecipes = await query;

            res.json({
                data: subrecipes,
                pagination: buildPaginationMeta(total, pagination.page, pagination.limit)
            });
        } else {
            // Return all without pagination for backwards compatibility
            const subrecipes = await SubRecipe.find(searchFilter)
                .populate('items.item')
                .sort(pagination.sort);
            res.json(subrecipes);
        }
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

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth, authorizeRole } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories (Authenticated users)
router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/categories
// @desc    Create a category (Admin & Chef)
router.post('/', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    const category = new Category({
        name: req.body.name,
        description: req.body.description
    });

    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/categories/:id
// @desc    Update a category (Admin & Chef)
router.put('/:id', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    try {
        const { name, description } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true }
        );
        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (Admin & Chef)
router.delete('/:id', auth, authorizeRole(['admin', 'chef']), async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

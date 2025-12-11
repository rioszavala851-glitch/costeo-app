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
    // Map frontend 'price' to backend 'cost' if necessary
    const costValue = req.body.cost !== undefined ? req.body.cost : req.body.price;

    const ingredient = new Ingredient({
        name: req.body.name,
        unit: req.body.unit,
        cost: costValue, // Save as cost
        yield: req.body.yield,
        category: req.body.category || 'general',
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        isSubRecipe: false
    });

    try {
        const newIngredient = await ingredient.save();
        res.status(201).json(newIngredient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/ingredients/:id
// @desc    Update an ingredient
router.put('/:id', async (req, res) => {
    try {
        const { name, unit, cost, price, yield: yieldVal, category, isActive } = req.body;

        // Map price into cost for updates
        const costToUpdate = cost !== undefined ? cost : price;

        const updatedIngredient = await Ingredient.findByIdAndUpdate(
            req.params.id,
            {
                name,
                unit,
                cost: costToUpdate,
                yield: yieldVal,
                category,
                isActive
            },
            { new: true } // Return the updated document
        );

        if (!updatedIngredient) {
            return res.status(404).json({ message: 'Ingredient not found' });
        }

        res.json(updatedIngredient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/ingredients/:id
// @desc    Delete an ingredient
router.delete('/:id', async (req, res) => {
    try {
        const ingredient = await Ingredient.findById(req.params.id);
        if (!ingredient) {
            return res.status(404).json({ message: 'Ingredient not found' });
        }

        await ingredient.deleteOne();
        res.json({ message: 'Ingredient removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

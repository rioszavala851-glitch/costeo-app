const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String, // e.g., 'kg', 'lt', 'pz'
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    yield: {
        type: Number, // Percentage, e.g., 100 or 0.8
        required: true,
        default: 100
    },
    category: {
        type: String,
        default: 'general'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSubRecipe: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', IngredientSchema);

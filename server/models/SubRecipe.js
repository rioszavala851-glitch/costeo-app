const mongoose = require('mongoose');

const SubRecipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String,
        required: true
    },
    yield: {
        type: Number,
        default: 100
    },
    items: [
        {
            item: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'items.itemModel'
            },
            itemModel: {
                type: String,
                required: true,
                enum: ['Ingredient', 'SubRecipe']
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ]
}, { timestamps: true });

// Virtual to calculate cost based on sub-items could be added here or in controller
SubRecipeSchema.set('toJSON', { virtuals: true });
SubRecipeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SubRecipe', SubRecipeSchema);

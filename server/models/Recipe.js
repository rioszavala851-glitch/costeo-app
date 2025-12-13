const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'General'
    },
    quantity: { // Cantidad que rinde la receta
        type: Number,
        required: true
    },
    unit: { // Unidad de la receta (ej. 'platillo', 'lt')
        type: String,
        required: true
    },
    yield: { // Rendimiento (%)
        type: Number,
        required: true
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
            quantity: { // Cantidad bruta usada
                type: Number,
                required: true
            }
        }
    ],
    utilityFactor: {
        type: Number, // Factor de utilidad deseado (ej. 3.0 para 300% o 0.30 margen)
        required: true
    },
    // Cached calculated values (optional, can be calculated on fly)
    totalCost: { type: Number }, // Costo ingredientes
    realCost: { type: Number }, // Costo real (con merma/rendimiento)
    suggestedPrice: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Recipe', RecipeSchema);

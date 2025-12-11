const mongoose = require('mongoose');

const CloudRecipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        default: 0
    },
    isPaid: {
        type: Boolean,
        default: true
    },
    content: {
        type: Object, // Stores the full recipe JSON structure
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    downloadCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('CloudRecipe', CloudRecipeSchema);

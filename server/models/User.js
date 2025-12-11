const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'chef', 'viewer'],
        default: 'viewer'
    },
    permissions: [{
        type: String
        // e.g., 'create_recipe', 'delete_user', 'access_cloud'
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

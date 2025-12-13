const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    }],
    // ========== FREEMIUM MODEL FIELDS ==========
    plan: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free'
    },
    // Track active session for single-device sync (free users)
    activeSessionToken: {
        type: String,
        default: null
    },
    activeSessionCreatedAt: {
        type: Date,
        default: null
    },
    // Premium subscription dates (for future use)
    premiumStartDate: {
        type: Date,
        default: null
    },
    premiumEndDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

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
    planType: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free'
    },
    // Cached recipe count for quick access
    currentRecipeCount: {
        type: Number,
        default: 0
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

// Virtual alias for backwards compatibility (plan -> planType)
UserSchema.virtual('plan').get(function () {
    return this.planType;
}).set(function (value) {
    this.planType = value;
});

// Hash password before saving
// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

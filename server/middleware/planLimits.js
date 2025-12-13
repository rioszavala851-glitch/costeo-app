/**
 * Freemium Plan Middleware & Utilities
 * Controls access to premium features and enforces limits
 */
const Recipe = require('../models/Recipe');

// Plan limits configuration
const PLAN_LIMITS = {
    free: {
        maxRecipes: 30,
        maxDevices: 1,
        features: {
            basicRecipes: true,
            ingredients: true,
            subRecipes: true,
            categories: true,
            // Premium features disabled
            costAnalysis: false,
            shoppingList: false,
            exportPDF: false,
            cloudSync: false,
            multiDevice: false,
            advancedReports: false
        }
    },
    premium: {
        maxRecipes: Infinity,
        maxDevices: Infinity,
        features: {
            basicRecipes: true,
            ingredients: true,
            subRecipes: true,
            categories: true,
            // Premium features enabled
            costAnalysis: true,
            shoppingList: true,
            exportPDF: true,
            cloudSync: true,
            multiDevice: true,
            advancedReports: true
        }
    }
};

/**
 * Get user's plan limits
 */
const getPlanLimits = (plan) => {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

/**
 * Check if user can create more recipes
 * Counts recipes PER USER for proper freemium limits
 */
const checkRecipeLimit = async (req, res, next) => {
    try {
        const user = req.user;
        const planLimits = getPlanLimits(user.plan || 'free');

        // Premium users have no limit
        if (user.plan === 'premium') {
            return next();
        }

        // Count recipes created BY THIS USER specifically
        const recipeCount = await Recipe.countDocuments({ createdBy: user.id });

        if (recipeCount >= planLimits.maxRecipes) {
            return res.status(403).json({
                message: `Has alcanzado el límite de ${planLimits.maxRecipes} recetas del plan gratuito. Actualiza a Premium para recetas ilimitadas.`,
                error: 'RECIPE_LIMIT_REACHED',
                limit: planLimits.maxRecipes,
                current: recipeCount,
                upgradeRequired: true
            });
        }

        // Add remaining count to request for frontend
        req.recipeLimit = {
            max: planLimits.maxRecipes,
            current: recipeCount,
            remaining: planLimits.maxRecipes - recipeCount
        };

        next();
    } catch (error) {
        console.error('Error checking recipe limit:', error);
        next(error);
    }
};

/**
 * Check if feature is available for user's plan
 */
const checkFeatureAccess = (featureName) => {
    return (req, res, next) => {
        const user = req.user;
        const planLimits = getPlanLimits(user.plan || 'free');

        if (!planLimits.features[featureName]) {
            return res.status(403).json({
                message: `Esta función está disponible solo para usuarios Premium.`,
                error: 'PREMIUM_FEATURE',
                feature: featureName,
                upgradeRequired: true
            });
        }

        next();
    };
};

/**
 * Validate single device session for free users
 */
const validateSession = async (req, res, next) => {
    try {
        const user = req.user;
        const currentToken = req.header('Authorization')?.replace('Bearer ', '');

        // Premium users can have multiple devices
        if (user.plan === 'premium') {
            return next();
        }

        // For free users, check if this is the active session
        if (user.activeSessionToken && user.activeSessionToken !== currentToken) {
            return res.status(403).json({
                message: 'Tu sesión ha sido iniciada en otro dispositivo. El plan gratuito permite solo 1 dispositivo activo.',
                error: 'SESSION_CONFLICT',
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        console.error('Error validating session:', error);
        next(error);
    }
};

/**
 * Get plan status for user - counts recipes PER USER
 */
const getPlanStatus = async (userId) => {
    const Recipe = require('../models/Recipe');
    const User = require('../models/User');

    const user = await User.findById(userId);
    if (!user) return null;

    const planLimits = getPlanLimits(user.plan || 'free');

    // Count recipes created BY THIS USER specifically
    const recipeCount = await Recipe.countDocuments({ createdBy: userId });

    return {
        plan: user.plan || 'free',
        isPremium: user.plan === 'premium',
        limits: {
            recipes: {
                max: planLimits.maxRecipes,
                current: recipeCount,
                remaining: Math.max(0, planLimits.maxRecipes - recipeCount),
                percentage: planLimits.maxRecipes === Infinity ? 0 : Math.round((recipeCount / planLimits.maxRecipes) * 100)
            },
            devices: {
                max: planLimits.maxDevices,
                current: 1 // Simplified for now
            }
        },
        features: planLimits.features,
        premiumStartDate: user.premiumStartDate,
        premiumEndDate: user.premiumEndDate
    };
};

/**
 * Get recipe count for a specific user
 */
const getUserRecipeCount = async (userId) => {
    return await Recipe.countDocuments({ createdBy: userId });
};

module.exports = {
    PLAN_LIMITS,
    getPlanLimits,
    checkRecipeLimit,
    checkFeatureAccess,
    validateSession,
    getPlanStatus,
    getUserRecipeCount
};

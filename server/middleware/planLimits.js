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

// ========== BACKEND "LOCK" - CRITICAL SECURITY ==========
// This is the most important security check. Never trust frontend only.

const LIMITE_FREE = 30; // Centralizada para fácil mantenimiento

/**
 * 🔒 CANDADO DEL BACKEND - Verificación de Límite de Recetas
 * Este middleware BLOQUEA la creación de recetas si el usuario excede su límite.
 * NUNCA confíes solo en el frontend para esto.
 */
const checkRecipeLimit = async (req, res, next) => {
    try {
        const user = req.user;

        // Validación de usuario
        if (!user || !user.id) {
            console.error('[LIMIT_CHECK] ❌ No user found in request');
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Usuario no autenticado'
            });
        }

        const userPlan = user.planType || user.plan || 'free';
        const planLimits = getPlanLimits(userPlan);

        // ✅ Premium users: Sin límite
        if (userPlan === 'premium') {
            console.log(`[LIMIT_CHECK] ✅ Usuario ${user.id} es Premium - Sin límite`);
            return next();
        }

        // 🔍 Contar recetas EN TIEMPO REAL (no confiar en cache para el candado)
        const cantidadActual = await Recipe.countDocuments({ createdBy: user.id });

        console.log(`[LIMIT_CHECK] Usuario ${user.id} - Plan: ${userPlan} - Recetas: ${cantidadActual}/${planLimits.maxRecipes}`);

        // 🔒 VERIFICACIÓN DEL LÍMITE
        if (cantidadActual >= LIMITE_FREE) {
            console.warn(`[LIMIT_CHECK] ⛔ BLOQUEADO: Usuario ${user.id} alcanzó límite (${cantidadActual}/${LIMITE_FREE})`);

            return res.status(403).json({
                error: 'LIMIT_REACHED',
                message: `Has alcanzado el límite de ${LIMITE_FREE} recetas gratuitas. Actualiza a Premium para recetas ilimitadas.`,
                limit: LIMITE_FREE,
                current: cantidadActual,
                upgradeRequired: true,
                upgradeUrl: '/admin?tab=premium' // URL para upgrade
            });
        }

        // ✅ Pasa la validación - puede continuar
        console.log(`[LIMIT_CHECK] ✅ Usuario ${user.id} puede crear receta (${cantidadActual + 1}/${LIMITE_FREE})`);

        // Agregar info del límite al request para el frontend
        req.recipeLimit = {
            max: LIMITE_FREE,
            current: cantidadActual,
            remaining: LIMITE_FREE - cantidadActual - 1, // -1 porque está por crear una
            nearLimit: (LIMITE_FREE - cantidadActual) <= 5
        };

        next();
    } catch (error) {
        console.error('[LIMIT_CHECK] ❌ Error checking recipe limit:', error);
        // En caso de error, bloquear por seguridad
        return res.status(500).json({
            error: 'LIMIT_CHECK_ERROR',
            message: 'Error al verificar límite de recetas. Intenta de nuevo.'
        });
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
 * Get plan status for user - uses cached currentRecipeCount when available
 */
const getPlanStatus = async (userId) => {
    const Recipe = require('../models/Recipe');
    const User = require('../models/User');

    const user = await User.findById(userId);
    if (!user) return null;

    const userPlan = user.planType || 'free';
    const planLimits = getPlanLimits(userPlan);

    // Use cached count or fetch from DB
    let recipeCount = user.currentRecipeCount || 0;

    // Verify and sync count if needed
    const actualCount = await Recipe.countDocuments({ createdBy: userId });
    if (actualCount !== recipeCount) {
        // Sync the cached count
        await User.findByIdAndUpdate(userId, { currentRecipeCount: actualCount });
        recipeCount = actualCount;
    }

    return {
        planType: userPlan,
        plan: userPlan, // Alias for backwards compatibility
        isPremium: userPlan === 'premium',
        currentRecipeCount: recipeCount,
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
    LIMITE_FREE,
    getPlanLimits,
    checkRecipeLimit,
    checkFeatureAccess,
    validateSession,
    getPlanStatus,
    getUserRecipeCount
};

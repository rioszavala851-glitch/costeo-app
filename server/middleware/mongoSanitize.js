/**
 * MongoDB Sanitization Middleware - Compatible with Express 5
 * Prevents NoSQL injection by removing $ and . operators from req.body only
 * (req.query and req.params are read-only in Express 5)
 */

const sanitize = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Skip keys that start with $ (MongoDB operators)
                if (key.startsWith('$')) {
                    continue;
                }
                // Skip keys that contain . (MongoDB nested field access)
                if (key.includes('.')) {
                    continue;
                }
                sanitized[key] = sanitize(obj[key]);
            }
        }
        return sanitized;
    }

    return obj;
};

module.exports = () => {
    return (req, res, next) => {
        try {
            // Only sanitize body - query and params are read-only in Express 5
            if (req.body) {
                req.body = sanitize(req.body);
            }
        } catch (err) {
            console.error('Error in mongoSanitize middleware:', err);
        }
        next();
    };
};

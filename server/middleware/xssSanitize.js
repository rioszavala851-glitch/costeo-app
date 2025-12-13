/**
 * XSS Sanitization Middleware - Compatible with Express 5
 * Sanitizes req.body to prevent XSS attacks
 */

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    // Replace dangerous HTML characters
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                sanitized[key] = sanitizeObject(obj[key]);
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
                req.body = sanitizeObject(req.body);
            }
        } catch (err) {
            console.error('Error in XSS sanitize middleware:', err);
        }
        next();
    };
};

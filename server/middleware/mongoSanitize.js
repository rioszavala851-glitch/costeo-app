const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else if (key.includes('.') && key !== 'content-type') { // Preserve content-type if it ends up in headers? usually we sanitize body/params/query.
                 delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
    return obj;
};

module.exports = () => {
    return (req, res, next) => {
        try {
            if (req.body) sanitize(req.body);
            if (req.params) sanitize(req.params);
            if (req.query) sanitize(req.query);
        } catch (err) {
            console.error('Error in mongoSanitize middleware:', err);
        }
        next();
    };
};

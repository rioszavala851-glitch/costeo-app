const { body, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

exports.validateSubRecipe = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre de la sub-receta es obligatorio'),

    body('unit')
        .trim()
        .notEmpty().withMessage('La unidad es obligatoria'),

    body('yield')
        .optional()
        .isNumeric().withMessage('El rendimiento debe ser un número')
        .isFloat({ min: 1, max: 100 }).withMessage('El rendimiento debe estar entre 1% y 100%'),

    body('items')
        .isArray({ min: 1 }).withMessage('La sub-receta debe tener al menos un ingrediente'),

    body('items.*.item')
        .isMongoId().withMessage('ID de item inválido'),

    body('items.*.itemModel')
        .isIn(['Ingredient', 'SubRecipe']).withMessage('El tipo de item debe ser Ingredient o SubRecipe'),

    body('items.*.quantity')
        .isNumeric().withMessage('La cantidad del item debe ser un número')
        .isFloat({ min: 0 }).withMessage('La cantidad del item debe ser mayor a 0'),

    validateResult
];

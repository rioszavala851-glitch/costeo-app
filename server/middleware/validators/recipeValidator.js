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

exports.validateRecipe = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre de la receta es obligatorio')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),

    body('quantity')
        .isNumeric().withMessage('La cantidad debe ser un número')
        .isFloat({ min: 0.01 }).withMessage('La cantidad debe ser mayor a 0'),

    body('unit')
        .trim()
        .notEmpty().withMessage('La unidad es obligatoria'),

    body('yield')
        .isNumeric().withMessage('El rendimiento debe ser un número')
        .isFloat({ min: 1, max: 100 }).withMessage('El rendimiento debe estar entre 1% y 100%'),

    body('utilityFactor')
        .isNumeric().withMessage('El factor de utilidad debe ser un número')
        .isFloat({ min: 0 }).withMessage('El factor de utilidad no puede ser negativo'),

    body('items')
        .isArray({ min: 1 }).withMessage('La receta debe tener al menos un ingrediente o sub-receta'),

    body('items.*.item')
        .isMongoId().withMessage('ID de item inválido'),

    body('items.*.itemModel')
        .isIn(['Ingredient', 'SubRecipe']).withMessage('El tipo de item debe ser Ingredient o SubRecipe'),

    body('items.*.quantity')
        .isNumeric().withMessage('La cantidad del item debe ser un número')
        .isFloat({ min: 0 }).withMessage('La cantidad del item debe ser mayor a 0'),

    validateResult
];

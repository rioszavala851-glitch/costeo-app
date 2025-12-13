/**
 * Ingredient Validation Tests
 * Tests for ingredient data validation
 */

describe('Ingredient Validation', () => {
    // Helper validators
    const validateIngredientName = (name) => {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 2 && trimmed.length <= 100;
    };

    const validateUnit = (unit) => {
        if (!unit || typeof unit !== 'string') return false;
        const validUnits = ['kg', 'gr', 'lt', 'ml', 'pza', 'unidad'];
        return validUnits.includes(unit.toLowerCase());
    };

    const validateCost = (cost) => {
        return typeof cost === 'number' && cost >= 0;
    };

    const validateYield = (yieldPercent) => {
        return typeof yieldPercent === 'number' && yieldPercent > 0 && yieldPercent <= 100;
    };

    describe('Name Validation', () => {
        it('should accept valid ingredient names', () => {
            expect(validateIngredientName('Tomate')).toBe(true);
            expect(validateIngredientName('Carne de Res')).toBe(true);
            expect(validateIngredientName('Aceite de Oliva Extra Virgen')).toBe(true);
        });

        it('should reject invalid ingredient names', () => {
            expect(validateIngredientName('')).toBe(false);
            expect(validateIngredientName('A')).toBe(false);
            expect(validateIngredientName(null)).toBe(false);
            expect(validateIngredientName(123)).toBe(false);
        });
    });

    describe('Unit Validation', () => {
        it('should accept valid units', () => {
            expect(validateUnit('kg')).toBe(true);
            expect(validateUnit('gr')).toBe(true);
            expect(validateUnit('lt')).toBe(true);
            expect(validateUnit('ml')).toBe(true);
            expect(validateUnit('pza')).toBe(true);
            expect(validateUnit('unidad')).toBe(true);
        });

        it('should reject invalid units', () => {
            expect(validateUnit('')).toBe(false);
            expect(validateUnit('invalid')).toBe(false);
            expect(validateUnit(null)).toBe(false);
            expect(validateUnit(123)).toBe(false);
        });
    });

    describe('Cost Validation', () => {
        it('should accept valid costs', () => {
            expect(validateCost(0)).toBe(true);
            expect(validateCost(10.50)).toBe(true);
            expect(validateCost(100)).toBe(true);
            expect(validateCost(999.99)).toBe(true);
        });

        it('should reject invalid costs', () => {
            expect(validateCost(-1)).toBe(false);
            expect(validateCost('-10')).toBe(false);
            expect(validateCost(null)).toBe(false);
        });
    });

    describe('Yield Validation', () => {
        it('should accept valid yield percentages', () => {
            expect(validateYield(100)).toBe(true);
            expect(validateYield(80)).toBe(true);
            expect(validateYield(50.5)).toBe(true);
            expect(validateYield(1)).toBe(true);
        });

        it('should reject invalid yield percentages', () => {
            expect(validateYield(0)).toBe(false);
            expect(validateYield(-10)).toBe(false);
            expect(validateYield(101)).toBe(false);
            expect(validateYield('80')).toBe(false);
            expect(validateYield(null)).toBe(false);
        });
    });
});

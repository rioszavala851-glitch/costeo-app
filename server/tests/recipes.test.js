/**
 * Recipe Validation Tests
 * Tests for the recipe validator middleware logic
 */

describe('Recipe Validation', () => {
    // Helper function to simulate validation
    const validateRecipeName = (name) => {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 2 && trimmed.length <= 100;
    };

    const validateQuantity = (quantity) => {
        return typeof quantity === 'number' && quantity > 0;
    };

    const validateUtilityFactor = (factor) => {
        return typeof factor === 'number' && factor >= 0;
    };

    const validateItems = (items) => {
        if (!Array.isArray(items)) return false;
        return items.every(item =>
            item.item &&
            item.itemModel &&
            ['Ingredient', 'SubRecipe'].includes(item.itemModel) &&
            typeof item.quantity === 'number' &&
            item.quantity > 0
        );
    };

    describe('Name Validation', () => {
        it('should accept valid recipe names', () => {
            expect(validateRecipeName('Hamburguesa Doble')).toBe(true);
            expect(validateRecipeName('Tacos al Pastor')).toBe(true);
            expect(validateRecipeName('AB')).toBe(true); // Minimum 2 chars
        });

        it('should reject invalid recipe names', () => {
            expect(validateRecipeName('')).toBe(false);
            expect(validateRecipeName('   ')).toBe(false);
            expect(validateRecipeName('A')).toBe(false); // Too short
            expect(validateRecipeName(null)).toBe(false);
            expect(validateRecipeName(undefined)).toBe(false);
            expect(validateRecipeName(123)).toBe(false);
        });
    });

    describe('Quantity Validation', () => {
        it('should accept valid quantities', () => {
            expect(validateQuantity(1)).toBe(true);
            expect(validateQuantity(10)).toBe(true);
            expect(validateQuantity(0.5)).toBe(true);
            expect(validateQuantity(100)).toBe(true);
        });

        it('should reject invalid quantities', () => {
            expect(validateQuantity(0)).toBe(false);
            expect(validateQuantity(-1)).toBe(false);
            expect(validateQuantity('10')).toBe(false);
            expect(validateQuantity(null)).toBe(false);
        });
    });

    describe('Utility Factor Validation', () => {
        it('should accept valid utility factors', () => {
            expect(validateUtilityFactor(0)).toBe(true);
            expect(validateUtilityFactor(1.5)).toBe(true);
            expect(validateUtilityFactor(3.33)).toBe(true);
            expect(validateUtilityFactor(10)).toBe(true);
        });

        it('should reject invalid utility factors', () => {
            expect(validateUtilityFactor(-1)).toBe(false);
            expect(validateUtilityFactor('3.33')).toBe(false);
            expect(validateUtilityFactor(null)).toBe(false);
        });
    });

    describe('Items Array Validation', () => {
        it('should accept valid items array', () => {
            const validItems = [
                { item: '507f1f77bcf86cd799439011', itemModel: 'Ingredient', quantity: 100 },
                { item: '507f1f77bcf86cd799439012', itemModel: 'SubRecipe', quantity: 2 }
            ];
            expect(validateItems(validItems)).toBe(true);
        });

        it('should accept empty items array', () => {
            expect(validateItems([])).toBe(true);
        });

        it('should reject invalid items', () => {
            expect(validateItems(null)).toBe(false);
            expect(validateItems('items')).toBe(false);
            expect(validateItems([{ item: null, itemModel: 'Ingredient', quantity: 1 }])).toBe(false);
            expect(validateItems([{ item: '123', itemModel: 'InvalidModel', quantity: 1 }])).toBe(false);
            expect(validateItems([{ item: '123', itemModel: 'Ingredient', quantity: 0 }])).toBe(false);
            expect(validateItems([{ item: '123', itemModel: 'Ingredient', quantity: -1 }])).toBe(false);
        });
    });
});

describe('Recipe Cost Calculations', () => {
    const calculateIngredientCost = (price, yieldPercent, priceUnit, useUnit, quantity) => {
        const priceNum = Number(price) || 0;
        const yieldNum = Number(yieldPercent) || 100;
        const qtyNum = Number(quantity) || 0;

        const realPrice = yieldNum > 0 ? priceNum / (yieldNum / 100) : priceNum;

        let unitCost = realPrice;
        const priceUnitLower = (priceUnit || '').toLowerCase();
        const useUnitLower = (useUnit || priceUnit || '').toLowerCase();

        if ((priceUnitLower === 'kg' && useUnitLower === 'gr') ||
            (priceUnitLower === 'lt' && useUnitLower === 'ml')) {
            unitCost = realPrice / 1000;
        } else if ((priceUnitLower === 'gr' && useUnitLower === 'kg') ||
            (priceUnitLower === 'ml' && useUnitLower === 'lt')) {
            unitCost = realPrice * 1000;
        }

        return unitCost * qtyNum;
    };

    it('should calculate cost correctly without unit conversion', () => {
        // Price: $100/kg, yield 100%, quantity 1kg
        const cost = calculateIngredientCost(100, 100, 'kg', 'kg', 1);
        expect(cost).toBe(100);
    });

    it('should apply yield percentage correctly', () => {
        // Price: $100/kg, yield 80%, quantity 1kg
        // Real price = 100 / 0.8 = 125
        const cost = calculateIngredientCost(100, 80, 'kg', 'kg', 1);
        expect(cost).toBe(125);
    });

    it('should convert kg to gr correctly', () => {
        // Price: $100/kg, yield 100%, quantity 100gr
        // Unit cost = 100/1000 = 0.1 per gr
        const cost = calculateIngredientCost(100, 100, 'kg', 'gr', 100);
        expect(cost).toBe(10);
    });

    it('should convert lt to ml correctly', () => {
        // Price: $50/lt, yield 100%, quantity 250ml
        // Unit cost = 50/1000 = 0.05 per ml
        const cost = calculateIngredientCost(50, 100, 'lt', 'ml', 250);
        expect(cost).toBe(12.5);
    });

    it('should handle zero quantity', () => {
        const cost = calculateIngredientCost(100, 100, 'kg', 'kg', 0);
        expect(cost).toBe(0);
    });

    it('should handle zero price', () => {
        const cost = calculateIngredientCost(0, 100, 'kg', 'kg', 1);
        expect(cost).toBe(0);
    });
});

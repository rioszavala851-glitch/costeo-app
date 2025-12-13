/**
 * SubRecipe Validation Tests
 * Tests for sub-recipe validation logic
 */

describe('SubRecipe Validation', () => {
    const validateSubRecipeName = (name) => {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 2 && trimmed.length <= 100;
    };

    const validateSubRecipeYield = (yieldValue) => {
        return typeof yieldValue === 'number' && yieldValue > 0;
    };

    const validateSubRecipeUnit = (unit) => {
        if (!unit || typeof unit !== 'string') return false;
        const validUnits = ['kg', 'gr', 'lt', 'ml', 'pza', 'unidad'];
        return validUnits.includes(unit.toLowerCase());
    };

    const validateSubRecipeItems = (items) => {
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
        it('should accept valid sub-recipe names', () => {
            expect(validateSubRecipeName('Salsa Roja')).toBe(true);
            expect(validateSubRecipeName('Masa para Tortillas')).toBe(true);
            expect(validateSubRecipeName('Caldo Base')).toBe(true);
        });

        it('should reject invalid names', () => {
            expect(validateSubRecipeName('')).toBe(false);
            expect(validateSubRecipeName('X')).toBe(false);
            expect(validateSubRecipeName(null)).toBe(false);
        });
    });

    describe('Yield Validation', () => {
        it('should accept valid yields', () => {
            expect(validateSubRecipeYield(1)).toBe(true);
            expect(validateSubRecipeYield(500)).toBe(true);
            expect(validateSubRecipeYield(2.5)).toBe(true);
        });

        it('should reject invalid yields', () => {
            expect(validateSubRecipeYield(0)).toBe(false);
            expect(validateSubRecipeYield(-1)).toBe(false);
            expect(validateSubRecipeYield('500')).toBe(false);
            expect(validateSubRecipeYield(null)).toBe(false);
        });
    });

    describe('Unit Validation', () => {
        it('should accept valid units', () => {
            expect(validateSubRecipeUnit('lt')).toBe(true);
            expect(validateSubRecipeUnit('kg')).toBe(true);
            expect(validateSubRecipeUnit('ml')).toBe(true);
        });

        it('should reject invalid units', () => {
            expect(validateSubRecipeUnit('')).toBe(false);
            expect(validateSubRecipeUnit('invalid')).toBe(false);
        });
    });

    describe('Items Validation', () => {
        it('should accept valid items', () => {
            const validItems = [
                { item: '123', itemModel: 'Ingredient', quantity: 100 }
            ];
            expect(validateSubRecipeItems(validItems)).toBe(true);
        });

        it('should accept empty items array', () => {
            expect(validateSubRecipeItems([])).toBe(true);
        });

        it('should reject items with invalid model', () => {
            const invalidItems = [
                { item: '123', itemModel: 'Recipe', quantity: 100 }
            ];
            expect(validateSubRecipeItems(invalidItems)).toBe(false);
        });
    });
});

describe('SubRecipe Cost Calculation', () => {
    const calculateSubRecipeCost = (items, ingredientsMap) => {
        if (!items || items.length === 0) return 0;

        return items.reduce((total, item) => {
            const ingredient = ingredientsMap.get(item.item);
            if (!ingredient) return total;

            const price = ingredient.price || 0;
            const yieldPercent = ingredient.yield || 100;
            const realPrice = price / (yieldPercent / 100);

            return total + (realPrice * item.quantity);
        }, 0);
    };

    const calculateCostPerUnit = (totalCost, yieldValue) => {
        if (yieldValue <= 0) return 0;
        return totalCost / yieldValue;
    };

    it('should calculate total cost from ingredients', () => {
        const ingredientsMap = new Map([
            ['ing1', { price: 100, yield: 100 }], // $100 per unit
            ['ing2', { price: 50, yield: 100 }]   // $50 per unit
        ]);

        const items = [
            { item: 'ing1', quantity: 1 },
            { item: 'ing2', quantity: 2 }
        ];

        const cost = calculateSubRecipeCost(items, ingredientsMap);
        expect(cost).toBe(200); // 100*1 + 50*2 = 200
    });

    it('should apply ingredient yield correctly', () => {
        const ingredientsMap = new Map([
            ['ing1', { price: 100, yield: 80 }] // Real price = 100/0.8 = 125
        ]);

        const items = [{ item: 'ing1', quantity: 1 }];

        const cost = calculateSubRecipeCost(items, ingredientsMap);
        expect(cost).toBe(125);
    });

    it('should calculate cost per unit correctly', () => {
        const totalCost = 500;
        const yieldValue = 10; // Produces 10 units

        const costPerUnit = calculateCostPerUnit(totalCost, yieldValue);
        expect(costPerUnit).toBe(50); // $50 per unit
    });

    it('should handle zero yield', () => {
        const costPerUnit = calculateCostPerUnit(100, 0);
        expect(costPerUnit).toBe(0);
    });

    it('should return zero for empty items', () => {
        const ingredientsMap = new Map();
        const cost = calculateSubRecipeCost([], ingredientsMap);
        expect(cost).toBe(0);
    });
});

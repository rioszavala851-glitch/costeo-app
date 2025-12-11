import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, UtensilsCrossed, X, Save, Trash2, ArrowRight, Pencil, ChefHat, DollarSign, Calculator, Eye, ChevronDown, Tag } from 'lucide-react';

/**
 * Calcula el costo real de un ingrediente basado en su precio, rendimiento y cantidad.
 * Fórmula:
 * 1. Precio Real = Precio / (Rendimiento / 100)
 * 2. Convertir a la unidad de uso (gr/ml si el precio está en kg/lt)
 * 3. Costo Total = Costo Unitario * Cantidad
 * 
 * @param {number} price - Precio base del ingrediente (por kg/lt/pz)
 * @param {number} yieldPercent - Rendimiento en porcentaje (ej: 80 para 80%)
 * @param {string} priceUnit - Unidad del precio del ingrediente (kg, lt, gr, ml, pz)
 * @param {string} useUnit - Unidad de uso en la receta (gr, ml, kg, lt, pz)
 * @param {number} quantity - Cantidad a utilizar en la receta
 * @returns {object} - { realPrice, unitCost, totalCost }
 */
const calculateIngredientCost = (price, yieldPercent, priceUnit, useUnit, quantity) => {
    const priceNum = Number(price) || 0;
    const yieldNum = Number(yieldPercent) || 100;
    const qtyNum = Number(quantity) || 0;

    // Paso 1: Precio Real = Precio / (Rendimiento / 100)
    const realPrice = yieldNum > 0 ? priceNum / (yieldNum / 100) : priceNum;

    // Paso 2: Calcular costo unitario según las unidades
    let unitCost = realPrice;
    const priceUnitLower = (priceUnit || '').toLowerCase();
    const useUnitLower = (useUnit || priceUnit || '').toLowerCase();

    // Conversión de unidades: precio en kg/lt, uso en gr/ml
    if ((priceUnitLower === 'kg' && useUnitLower === 'gr') ||
        (priceUnitLower === 'lt' && useUnitLower === 'ml')) {
        // Precio está en kg/lt, cantidad en gr/ml -> dividir entre 1000
        unitCost = realPrice / 1000;
    } else if ((priceUnitLower === 'gr' && useUnitLower === 'kg') ||
        (priceUnitLower === 'ml' && useUnitLower === 'lt')) {
        // Precio está en gr/ml, cantidad en kg/lt -> multiplicar por 1000
        unitCost = realPrice * 1000;
    } else {
        // Mismas unidades o unidades no convertibles (pz)
        unitCost = realPrice;
    }

    // Paso 3: Costo Total = Costo Unitario * Cantidad
    const totalCost = unitCost * qtyNum;

    return {
        realPrice: realPrice,      // Precio real ajustado por rendimiento (en unidad original)
        unitCost: unitCost,        // Costo por unidad de uso (gr/ml/pz)
        totalCost: totalCost       // Costo total del ingrediente en la receta
    };
};

const Recipes = () => {
    // State for recipes
    const [recipes, setRecipes] = useState(() => {
        const saved = localStorage.getItem('recipes');
        return saved ? JSON.parse(saved) : [];
    });
    const [isAdding, setIsAdding] = useState(false);

    // State for creating a new recipe
    const [newRecipe, setNewRecipe] = useState({
        name: '',
        portions: 1,
        sellingPrice: 0,
        category: 'Platillo Principal',
        cost: 0
    });

    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);

    // New features state
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [showChefModeModal, setShowChefModeModal] = useState(false);
    const [selectedRecipeForAction, setSelectedRecipeForAction] = useState(null);
    const [productionQuantity, setProductionQuantity] = useState(0);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Data sources for selection
    const [availableItems, setAvailableItems] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const savedCategories = localStorage.getItem('categories');
        if (savedCategories) {
            setCategories(JSON.parse(savedCategories));
        }
    }, [isAdding]);

    useEffect(() => {
        const savedIngredients = localStorage.getItem('ingredients');
        const savedSubRecipes = localStorage.getItem('subRecipes');

        // Parse ingredients early to create lookup map
        let parsedIngredients = [];
        if (savedIngredients) {
            parsedIngredients = JSON.parse(savedIngredients);
        }
        const ingredientsMap = new Map(parsedIngredients.map(i => [i.id, i]));

        let items = [];

        // Función para recalcular el costo de una sub-receta
        const recalculateSubRecipeCost = (subRecipe) => {
            if (!subRecipe.ingredients || subRecipe.ingredients.length === 0) {
                return Number(subRecipe.cost) || 0;
            }

            return subRecipe.ingredients.reduce((acc, ing) => {
                // Lookup current ingredient data
                const currentIng = ingredientsMap.get(ing.id);

                // Use current price/yield if available, otherwise fallback to snapshot
                const priceNum = currentIng ? (Number(currentIng.price) || 0) : (Number(ing.price) || 0);
                const yieldNum = currentIng ? (Number(currentIng.yield) || 100) : (Number(ing.yield) || 100);
                const qtyNum = Number(ing.quantity) || 0;

                // Precio Real = Precio / (Rendimiento / 100)
                const realPrice = yieldNum > 0 ? priceNum / (yieldNum / 100) : priceNum;

                // Determinar unidades
                const priceUnitLower = (ing.priceUnit || ing.unit || '').toLowerCase();
                const useUnitLower = (ing.useUnit || ing.unit || '').toLowerCase();

                // Calcular costo unitario con conversión si es necesario
                let unitCost = realPrice;
                if ((priceUnitLower === 'kg' && useUnitLower === 'gr') ||
                    (priceUnitLower === 'lt' && useUnitLower === 'ml')) {
                    unitCost = realPrice / 1000;
                } else if ((priceUnitLower === 'gr' && useUnitLower === 'kg') ||
                    (priceUnitLower === 'ml' && useUnitLower === 'lt')) {
                    unitCost = realPrice * 1000;
                }

                return acc + (unitCost * qtyNum);
            }, 0);
        };

        if (parsedIngredients.length > 0) {
            items = [...items, ...parsedIngredients.map(i => ({
                ...i,
                price: Number(i.price) || 0, // Precio base por kg/lt/pz
                yield: Number(i.yield) || 100, // Rendimiento en %
                type: 'ingredient'
            }))];
        }
        if (savedSubRecipes) {
            // Recalcular el costo de cada sub-receta con la fórmula correcta
            items = [...items, ...JSON.parse(savedSubRecipes).map(s => {
                const recalculatedCost = recalculateSubRecipeCost(s);
                const subYield = parseFloat(s.yield) || 1;
                return {
                    id: `sub-${s.id}`,
                    name: s.name,
                    unit: s.unit,
                    price: recalculatedCost / subYield, // Costo por unidad (lt, kg, pz)
                    yield: 100, // Sub-recetas ya están procesadas, rendimiento 100%
                    type: 'subrecipe'
                };
            })];
        }
        setAvailableItems(items);
    }, [isAdding]);

    useEffect(() => {
        localStorage.setItem('recipes', JSON.stringify(recipes));
    }, [recipes]);

    // Calculate total cost usando la fórmula de costeo real
    // Para cada ingrediente: Precio Real = Precio / (Rendimiento/100)
    // Conversión de unidades: kg→gr, lt→ml divide entre 1000
    // Costo Total = Costo Unitario * Cantidad
    const totalCost = selectedIngredients.reduce((acc, item) => {
        const costData = calculateIngredientCost(
            item.price,
            item.yield || 100,
            item.priceUnit || item.unit,  // Unidad del precio
            item.useUnit || item.unit,     // Unidad de uso
            item.quantity
        );
        return acc + costData.totalCost;
    }, 0);
    const costPerPortion = newRecipe.portions > 0 ? totalCost / newRecipe.portions : 0;

    const handleAddIngredient = (item) => {
        // Determinar la unidad de uso sugerida
        // Tanto ingredientes como sub-recetas convierten kg→gr, lt→ml
        let suggestedUnit = item.unit;
        if (item.unit === 'kg') suggestedUnit = 'gr';
        if (item.unit === 'lt') suggestedUnit = 'ml';

        const quantity = prompt(`Ingrese la cantidad de ${item.name} (en ${suggestedUnit}):`);;
        if (quantity && !isNaN(quantity)) {
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    ...item,
                    quantity: parseFloat(quantity),
                    priceUnit: item.unit,  // Unidad original del precio
                    useUnit: suggestedUnit // Unidad de uso en la receta
                }
            ]);
            setSearchTerm('');
        }
    };

    const handleRemoveIngredient = (index) => {
        const newIngredients = [...selectedIngredients];
        newIngredients.splice(index, 1);
        setSelectedIngredients(newIngredients);
    };

    const handleSaveRecipe = (e) => {
        e.preventDefault();

        // Validate utility factor
        const factor = parseFloat(newRecipe.utilityPercentage) || 0;
        if (factor === 0 || newRecipe.utilityPercentage === '' || newRecipe.utilityPercentage === null) {
            alert('⚠️ El Factor de Utilidad no puede ser 0 o estar vacío. Por favor ingresa un valor entre 1 y 10.');
            return;
        }

        // Calculate final price: Cost * Factor
        const finalSellingPrice = costPerPortion * factor;

        const recipeData = {
            ...newRecipe,
            ingredients: selectedIngredients,
            totalCost: totalCost,
            costPerPortion: costPerPortion,
            sellingPrice: parseFloat(finalSellingPrice.toFixed(2)), // Save with 2 decimals
            id: editingId || Date.now()
        };

        if (editingId) {
            setRecipes(recipes.map(r => r.id === editingId ? recipeData : r));
        } else {
            setRecipes([...recipes, recipeData]);
        }

        setIsAdding(false);
        setEditingId(null);
        setIsAdding(false);
        setEditingId(null);
        setNewRecipe({ name: '', portions: 1, sellingPrice: 0, category: '', cost: 0, utilityPercentage: 3.33 });
        setSelectedIngredients([]);
    };

    const handleEditRecipe = (recipe) => {
        // Calculate implicit factor if not saved (Price / Cost)
        let implicitFactor = recipe.utilityPercentage;
        if (implicitFactor === undefined || implicitFactor === null) {
            if (recipe.sellingPrice > 0 && recipe.costPerPortion > 0) {
                implicitFactor = recipe.sellingPrice / recipe.costPerPortion;
            } else {
                implicitFactor = 3.33; // Default
            }
        }

        setNewRecipe({
            name: recipe.name,
            portions: recipe.portions,
            sellingPrice: recipe.sellingPrice,
            category: recipe.category || '',
            cost: recipe.cost || 0,
            utilityPercentage: parseFloat(implicitFactor).toFixed(2)
        });
        setSelectedIngredients(recipe.ingredients || []);
        setEditingId(recipe.id);
        setIsAdding(true);
    };

    const filteredItems = availableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate dynamic price for display (Cost * Factor)
    const currentFactor = parseFloat(newRecipe.utilityPercentage) || 0;
    const dynamicSellingPrice = costPerPortion * currentFactor;

    // Production Calculation Handler
    const handleOpenProduction = (recipe) => {
        setSelectedRecipeForAction(recipe);
        setProductionQuantity(recipe.portions); // Default to original portions
        setShowProductionModal(true);
    };

    // Chef Mode Handler
    const handleOpenChefMode = (recipe) => {
        setSelectedRecipeForAction(recipe);
        setShowChefModeModal(true);
    };

    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    return (
        <div className="animate-fade-in">

            {/* Production Calculator Modal */}
            {showProductionModal && selectedRecipeForAction && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--accent-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
                                <Calculator size={24} /> Calculadora de Producción
                            </h2>
                            <button onClick={() => setShowProductionModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>{selectedRecipeForAction.name}</h3>
                            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Rendimiento Original</label>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedRecipeForAction.portions} porciones</div>
                                </div>
                                <ArrowRight size={20} color="var(--text-secondary)" />
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Producción Deseada</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={productionQuantity}
                                        onChange={(e) => setProductionQuantity(Math.max(1, parseFloat(e.target.value) || 0))}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--accent-color)', background: 'var(--bg-secondary)', color: 'white', fontWeight: 'bold' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '0.75rem 0.5rem' }}>Ingrediente</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Cant. Original</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--accent-color)' }}>Cant. Necesaria</th>
                                    <th style={{ padding: '0.75rem 0.5rem' }}>Unidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedRecipeForAction.ingredients.map((item, idx) => {
                                    const ratio = productionQuantity / selectedRecipeForAction.portions;
                                    const neededQty = item.quantity * ratio;
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>{item.name}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.quantity.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '1.1rem' }}>{neededQty.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>{item.useUnit || item.unit}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Chef Mode Modal (Kitchen View) */}
            {showChefModeModal && selectedRecipeForAction && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflowY: 'auto' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <ChefHat size={32} color="var(--accent-color)" />
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Modo Chef (Cocina)</h1>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Vista simplificada para producción</p>
                            </div>
                        </div>
                        <button onClick={() => setShowChefModeModal(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--bg-primary)', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold' }}>
                            <X size={20} /> Cerrar Vista
                        </button>
                    </div>

                    <div style={{ maxWidth: '800px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>{selectedRecipeForAction.name}</h1>
                            <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'var(--accent-color)', borderRadius: '2rem', fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                                Rendimiento: {selectedRecipeForAction.portions} Porciones
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '2rem', border: '1px solid var(--glass-border)' }}>
                            <h2 style={{ borderBottom: '2px solid var(--accent-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>Ingredientes Requeridos</h2>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                                {selectedRecipeForAction.ingredients.map((item, idx) => (
                                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: '1.2rem' }}>
                                        <span style={{ fontWeight: '500' }}>{item.name}</span>
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                            {item.quantity} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{item.useUnit || item.unit}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--accent-color)', padding: '0.75rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                        <UtensilsCrossed size={28} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Recetas / Platillos</h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestiona tus menús y costos finales</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setNewRecipe({ name: '', portions: 1, sellingPrice: 0, category: '', cost: 0, utilityPercentage: 30 });
                        setSelectedIngredients([]);
                    }}
                    className="btn-primary"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'var(--accent-color)', color: 'white', border: 'none',
                        padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Nueva Receta
                </button>
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--accent-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{editingId ? 'Editar Receta' : 'Nueva Receta'}</h3>
                        <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{editingId ? 'Editar Receta' : 'Nueva Receta'}</h3>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); setNewRecipe({ name: '', portions: 1, sellingPrice: 0, category: '', cost: 0 }); setSelectedIngredients([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSaveRecipe}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Categoría</label>
                                <select
                                    required
                                    value={newRecipe.category}
                                    onChange={e => setNewRecipe({ ...newRecipe, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                                >
                                    <option value="" disabled>Selecciona una categoría</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    {categories.length === 0 && <option value="General">General (Crear categorías primero)</option>}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre del Platillo</label>
                                <input
                                    required
                                    type="text"
                                    value={newRecipe.name}
                                    onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })}
                                    placeholder="Ej. Hamburguesa Doble"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Porciones (Rendimiento)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newRecipe.portions}
                                    onChange={e => setNewRecipe({ ...newRecipe, portions: parseInt(e.target.value) || 1 })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Costo Unitario (Auto)</label>
                                <div style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                    ${costPerPortion.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Factor de Utilidad (0 - 10)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newRecipe.utilityPercentage ?? ''}
                                    onChange={(e) => {
                                        const inputVal = e.target.value;
                                        if (inputVal === '') {
                                            setNewRecipe({ ...newRecipe, utilityPercentage: '' });
                                            return;
                                        }
                                        let val = parseFloat(inputVal);
                                        if (isNaN(val)) val = 0;
                                        if (val > 10) val = 10;
                                        if (val < 0) val = 0;
                                        setNewRecipe({ ...newRecipe, utilityPercentage: val });
                                    }}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--accent-color)', outline: 'none', fontWeight: 'bold' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Precio Sugerido / Venta ($)</label>
                                <input
                                    readOnly
                                    type="text"
                                    value={dynamicSellingPrice.toFixed(2)}
                                    title="Calculado automáticamente basado en el costo y utilidad"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent-color)', color: 'var(--text-primary)', outline: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Ingredientes y Sub-recetas</h4>

                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar ingrediente o sub-receta..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white' }}
                                />
                                {searchTerm && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                        {filteredItems.map((item, idx) => (
                                            <div key={`${item.id}-${idx}`} onClick={() => handleAddIngredient(item)} style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {item.type === 'subrecipe' && <ChefHat size={14} color="var(--accent-color)" />}
                                                    {item.name}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>${item.price.toFixed(2)}/{item.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected List */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)' }}>
                                        <th style={{ padding: '0.5rem' }}>Ingrediente</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Cant.</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>U.M.</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Rend.</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Precio</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>P. Real</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Costo Unit.</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Costo</th>
                                        <th style={{ padding: '0.5rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedIngredients.map((item, idx) => {
                                        const costData = calculateIngredientCost(
                                            item.price,
                                            item.yield || 100,
                                            item.priceUnit || item.unit,  // Unidad del precio
                                            item.useUnit || item.unit,     // Unidad de uso
                                            item.quantity
                                        );
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.5rem' }}>{item.name}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.useUnit || item.unit}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.yield || 100}%</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>${Number(item.price).toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--warning)' }}>${costData.realPrice.toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>${costData.unitCost.toFixed(4)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>${costData.totalCost.toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newQty = prompt("Nueva cantidad:", item.quantity);
                                                                if (newQty && !isNaN(newQty)) {
                                                                    const newIngs = [...selectedIngredients];
                                                                    newIngs[idx].quantity = parseFloat(newQty);
                                                                    setSelectedIngredients(newIngs);
                                                                }
                                                            }}
                                                            style={{ color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                            title="Modificar Cantidad"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveIngredient(idx)}
                                                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                            title="Eliminar Insumo"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <td colSpan="7" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>Costo Total Receta:</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--success)', fontSize: '1rem' }}>${totalCost.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--success)', border: 'none', padding: '0.75rem 2rem', borderRadius: 'var(--radius)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                <Save size={18} /> Guardar Receta
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List of Recipes */}
            <div className="card">
                {recipes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ background: 'var(--bg-primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <UtensilsCrossed size={40} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No has creado recetas aún</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
                            Crea tus platillos finales combinando ingredientes y sub-recetas para saber tu costo real y ganancia.
                        </p>
                        <button onClick={() => setIsAdding(true)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold' }}>
                            Crear mi primera receta
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* Group recipes by category */}
                        {[...new Set(recipes.map(r => r.category || 'Sin Categoría'))].sort().map(categoryName => {
                            const categoryRecipes = recipes.filter(r => (r.category || 'Sin Categoría') === categoryName);
                            const isExpanded = expandedCategories[categoryName];
                            const categoryObj = categories.find(c => c.name === categoryName);
                            const categoryDesc = categoryObj?.description;

                            return (
                                <div key={categoryName} style={{ marginBottom: '1rem' }}>
                                    <h3
                                        onClick={() => toggleCategory(categoryName)}
                                        style={{
                                            color: 'var(--accent-color)',
                                            borderBottom: '1px solid var(--glass-border)',
                                            paddingBottom: '0.5rem',
                                            marginBottom: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer',
                                            userSelect: 'none'
                                        }}>
                                        <div style={{
                                            transition: 'transform 0.2s',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            display: 'flex', alignItems: 'center'
                                        }}>
                                            <ChevronDown size={20} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Tag size={18} />
                                            <span>{categoryName}</span>
                                        </div>
                                        {categoryDesc && (
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal', fontStyle: 'italic', borderLeft: '1px solid var(--glass-border)', paddingLeft: '0.5rem' }}>
                                                {categoryDesc}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: 'auto' }}>({categoryRecipes.length})</span>
                                    </h3>

                                    {!isExpanded && (
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.8rem', color: 'var(--text-primary)' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                                                    <th style={{ padding: '0 1.5rem' }}>Platillo</th>
                                                    <th style={{ padding: '0 1rem' }}>Costo ($)</th>
                                                    <th style={{ padding: '0 1rem' }}>Precio Venta ($)</th>
                                                    <th style={{ padding: '0 1rem' }}>Utilidad Calc.</th>
                                                    <th style={{ padding: '0 1.5rem' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categoryRecipes.map(r => {
                                                    const utility = r.sellingPrice > 0 ? ((r.sellingPrice - r.costPerPortion) / r.sellingPrice) * 100 : 0;
                                                    return (
                                                        <tr key={r.id} style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                            <td style={{ padding: '1rem 1.5rem', borderTopLeftRadius: '1rem', borderBottomLeftRadius: '1rem', fontWeight: 'bold' }}>
                                                                {r.name}
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                                                    {r.category || 'General'} • {r.ingredients.length} insumos
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                ${r.costPerPortion.toFixed(2)}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                ${r.sellingPrice.toFixed(2)}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span style={{ color: utility > 30 ? 'var(--success)' : (utility > 0 ? 'var(--warning)' : 'var(--danger)'), fontWeight: 'bold' }}>
                                                                    {utility.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem 1.5rem', borderTopRightRadius: '1rem', borderBottomRightRadius: '1rem' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button onClick={() => handleOpenChefMode(r)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }} title="Modo Chef (Cocina)"><Eye size={18} /></button>
                                                                    <button onClick={() => handleOpenProduction(r)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }} title="Calculadora de Producción"><Calculator size={18} /></button>
                                                                    <button onClick={() => handleEditRecipe(r)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }} title="Editar Receta"><Pencil size={18} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            );
                        })
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recipes;

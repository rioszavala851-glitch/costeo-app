import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, ChefHat, X, Save, Trash2, ArrowRight, Pencil } from 'lucide-react';
import styles from './SubRecipes.module.css';

/**
 * Calcula el costo real de un ingrediente basado en su precio, rendimiento y cantidad.
 * Fórmula:
 * 1. Precio Real = Precio / (Rendimiento / 100)
 * 2. Convertir a la unidad de uso (gr/ml si el precio está en kg/lt)
 * 3. Costo Total = Costo Unitario * Cantidad
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
        unitCost = realPrice / 1000;
    } else if ((priceUnitLower === 'gr' && useUnitLower === 'kg') ||
        (priceUnitLower === 'ml' && useUnitLower === 'lt')) {
        unitCost = realPrice * 1000;
    } else {
        unitCost = realPrice;
    }

    // Paso 3: Costo Total = Costo Unitario * Cantidad
    const totalCost = unitCost * qtyNum;

    return { realPrice, unitCost, totalCost };
};

const SubRecipes = () => {
    const [subRecipes, setSubRecipes] = useState(() => {
        const saved = localStorage.getItem('subRecipes');
        return saved ? JSON.parse(saved) : [];
    });
    const { user } = useAuth();
    const canEdit = user?.role !== 'viewer';
    const [isAdding, setIsAdding] = useState(false);

    // State for creating a new sub-recipe
    const [newSubRecipe, setNewSubRecipe] = useState({ name: '', unit: 'lt', yield: 1, cost: 0 });
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingId, setEditingId] = useState(null);

    // Dynamic Ingredients from LocalStorage + Mock Fallback
    const [availableIngredients, setAvailableIngredients] = useState([]);

    useEffect(() => {
        const savedIngredients = localStorage.getItem('ingredients');
        if (savedIngredients) {
            // Incluir yield de cada ingrediente
            setAvailableIngredients(JSON.parse(savedIngredients).map(i => ({
                ...i,
                price: Number(i.price) || 0,
                yield: Number(i.yield) || 100
            })));
        } else {
            // Fallback mock if nothing in local storage
            setAvailableIngredients([
                { id: 1, name: 'Tomate', price: 25.50, unit: 'kg', yield: 95 },
                { id: 2, name: 'Cebolla', price: 15.00, unit: 'kg', yield: 90 },
                { id: 3, name: 'Ajo', price: 80.00, unit: 'kg', yield: 100 },
            ]);
        }
    }, [isAdding]); // Refresh when opening form

    useEffect(() => {
        localStorage.setItem('subRecipes', JSON.stringify(subRecipes));
    }, [subRecipes]);

    const loadTestData = () => {
        // Need basic ingredients first to make sense
        const mockSub = {
            id: Date.now(),
            name: 'Salsa de Tomate Base',
            unit: 'lt',
            yield: 90,
            cost: 135.50,
            ingredients: [
                { id: 1, name: 'Tomate', price: 25.50, unit: 'kg', yield: 95, quantity: 5 },
                { id: 2, name: 'Cebolla', price: 15.00, unit: 'kg', yield: 90, quantity: 0.5 },
                { id: 3, name: 'Ajo', price: 80.00, unit: 'kg', yield: 100, quantity: 0.1 }
            ],
            isActive: true
        };
        setSubRecipes([mockSub]);
    };

    // Calculate total cost usando la fórmula de costeo real
    const totalCost = selectedIngredients.reduce((acc, ing) => {
        const costData = calculateIngredientCost(
            ing.price,
            ing.yield || 100,
            ing.priceUnit || ing.unit,  // Unidad del precio
            ing.useUnit || ing.unit,     // Unidad de uso
            ing.quantity
        );
        return acc + costData.totalCost;
    }, 0);

    const handleAddIngredient = (ing) => {
        // Prevent duplicates
        if (selectedIngredients.some(i => i.id === ing.id)) {
            alert("Este ingrediente ya está en la lista.");
            return;
        }

        // Determinar la unidad de uso sugerida
        let suggestedUnit = ing.unit;
        if (ing.unit === 'kg') suggestedUnit = 'gr';
        if (ing.unit === 'lt') suggestedUnit = 'ml';

        const quantity = prompt(`Ingrese la cantidad de ${ing.name} (en ${suggestedUnit}): `);
        if (quantity && !isNaN(quantity)) {
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    ...ing,
                    quantity: parseFloat(quantity),
                    priceUnit: ing.unit,  // Unidad original del precio
                    useUnit: suggestedUnit // Unidad de uso en la receta
                }
            ]);
            setSearchTerm(''); // Clear search after adding
        }
    };

    const handleRemoveIngredient = (id) => {
        setSelectedIngredients(selectedIngredients.filter(i => i.id !== id));
    };

    const handleEditSubRecipe = (sub) => {
        setNewSubRecipe({ name: sub.name, unit: sub.unit, yield: sub.yield, cost: sub.cost });
        setSelectedIngredients(sub.ingredients);
        setEditingId(sub.id);
        setIsAdding(true);
    };

    const handleSaveSubRecipe = (e) => {
        e.preventDefault();

        const subRecipeData = {
            ...newSubRecipe,
            ingredients: selectedIngredients,
            cost: totalCost,
            isActive: true
        };

        if (editingId) {
            setSubRecipes(subRecipes.map(sub => sub.id === editingId ? { ...subRecipeData, id: editingId } : sub));
            alert("Sub-receta actualizada correctamente");
        } else {
            setSubRecipes([...subRecipes, { ...subRecipeData, id: Date.now() }]);
            alert("Sub-receta creada correctamente");
        }

        // Reset Form
        setIsAdding(false);
        setEditingId(null);
        setNewSubRecipe({ name: '', unit: 'lt', yield: 1, cost: 0 });
        setSelectedIngredients([]);
        setSearchTerm('');
    };

    const filteredIngredients = availableIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <div className={styles.iconBox}>
                        <ChefHat size={28} color="white" />
                    </div>
                    <div>
                        <h1 className={styles.title}>Sub-recetas</h1>
                        <p className={styles.subtitle}>Preparaciones base para tus platillos</p>
                    </div>
                </div>

                {canEdit && (
                    <div className={styles.actions}>
                        <button onClick={() => setIsAdding(true)} className={styles.btnPrimary}>
                            <Plus size={20} />
                            Agregar Sub-receta
                        </button>
                    </div>
                )}
            </header>

            {/* Formulario Agregar (Hidden by default) */}
            {isAdding && (
                <div className={styles.card}>
                    <div className={styles.header} style={{ marginBottom: '1rem' }}>
                        <h3 className={styles.title} style={{ fontSize: '1.25rem', color: 'var(--accent-color)' }}>Nueva Sub-receta</h3>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); setNewSubRecipe({ name: '', unit: 'lt', yield: 1, cost: 0 }); setSelectedIngredients([]); setSearchTerm(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSaveSubRecipe}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre de la preparación</label>
                                <input
                                    required
                                    type="text"
                                    value={newSubRecipe.name}
                                    onChange={e => setNewSubRecipe({ ...newSubRecipe, name: e.target.value })}
                                    placeholder="Ej. Salsa de Tomate Base"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Unidad Final</label>
                                <select
                                    value={newSubRecipe.unit}
                                    onChange={e => setNewSubRecipe({ ...newSubRecipe, unit: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="lt">Litros (lt)</option>
                                    <option value="kg">Kilogramos (kg)</option>
                                    <option value="pz">Piezas (pz)</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Cantidad Resultante ({newSubRecipe.unit})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newSubRecipe.yield}
                                    onChange={e => setNewSubRecipe({ ...newSubRecipe, yield: e.target.value })}
                                    placeholder="Ej. 1.5"
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        {/* Ingredients Selection Section */}
                        <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Ingredientes de la Receta</h4>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={18} className={styles.label} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar ingredientes (ej. Tomate, Cebolla)..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className={styles.input}
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                    {searchTerm && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                            {filteredIngredients.map(ing => (
                                                <div
                                                    key={ing.id}
                                                    onClick={() => handleAddIngredient(ing)}
                                                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}
                                                >
                                                    <span>{ing.name}</span>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>${ing.price}/{ing.unit}</span>
                                                </div>
                                            ))}
                                            {filteredIngredients.length === 0 && <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>No se encontraron ingredientes.</div>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Ingredients List */}
                            {selectedIngredients.length > 0 ? (
                                <div className={styles.tableContainer}>
                                    <table className={styles.table} style={{ fontSize: '0.85rem', minWidth: '600px' }}>
                                        <thead>
                                            <tr>
                                                <th className={styles.th}>Ingrediente</th>
                                                <th className={styles.th} style={{ textAlign: 'center' }}>Cant.</th>
                                                <th className={styles.th} style={{ textAlign: 'center' }}>U.M.</th>
                                                <th className={styles.th} style={{ textAlign: 'center' }}>Rend.</th>
                                                <th className={styles.th} style={{ textAlign: 'right' }}>Precio</th>
                                                <th className={styles.th} style={{ textAlign: 'right' }}>P. Real</th>
                                                <th className={styles.th} style={{ textAlign: 'right' }}>Costo Unit.</th>
                                                <th className={styles.th} style={{ textAlign: 'right' }}>Costo</th>
                                                <th className={styles.th}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedIngredients.map(ing => {
                                                const costData = calculateIngredientCost(
                                                    ing.price,
                                                    ing.yield || 100,
                                                    ing.priceUnit || ing.unit,  // Unidad del precio
                                                    ing.useUnit || ing.unit,     // Unidad de uso
                                                    ing.quantity
                                                );
                                                return (
                                                    <tr key={ing.id}>
                                                        <td className={styles.td}>{ing.name}</td>
                                                        <td className={styles.td} style={{ textAlign: 'center' }}>{ing.quantity}</td>
                                                        <td className={styles.td} style={{ textAlign: 'center' }}>{ing.useUnit || ing.unit}</td>
                                                        <td className={styles.td} style={{ textAlign: 'center' }}>{ing.yield || 100}%</td>
                                                        <td className={styles.td} style={{ textAlign: 'right' }}>${Number(ing.price).toFixed(2)}</td>
                                                        <td className={styles.td} style={{ textAlign: 'right', color: 'var(--warning)' }}>${costData.realPrice.toFixed(2)}</td>
                                                        <td className={styles.td} style={{ textAlign: 'right' }}>${costData.unitCost.toFixed(4)}</td>
                                                        <td className={styles.td} style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>${costData.totalCost.toFixed(2)}</td>
                                                        <td className={styles.td} style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newQty = prompt("Nueva cantidad:", ing.quantity);
                                                                        if (newQty && !isNaN(newQty)) {
                                                                            setSelectedIngredients(selectedIngredients.map(i =>
                                                                                i.id === ing.id ? { ...i, quantity: parseFloat(newQty) } : i
                                                                            ));
                                                                        }
                                                                    }}
                                                                    className={styles.actionBtn}
                                                                    title="Modificar Cantidad"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveIngredient(ing.id)}
                                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                                    title="Eliminar Ingrediente"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                <td colSpan="7" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>Costo Total Sub-receta:</td>
                                                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--success)', fontSize: '1rem' }}>${totalCost.toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                            <tr style={{ borderTop: '1px dashed var(--glass-border)' }}>
                                                <td colSpan="7" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    Costo por {newSubRecipe.unit}:
                                                </td>
                                                <td style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                    ${(newSubRecipe.yield > 0 ? (totalCost / parseFloat(newSubRecipe.yield || 1)) : 0).toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            {(newSubRecipe.unit === 'lt' || newSubRecipe.unit === 'kg') && (
                                                <tr>
                                                    <td colSpan="7" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        Costo por {newSubRecipe.unit === 'lt' ? 'ml' : 'gr'}:
                                                    </td>
                                                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                        ${(newSubRecipe.yield > 0 ? (totalCost / parseFloat(newSubRecipe.yield || 1) / 1000) : 0).toFixed(4)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontStyle: 'italic' }}>No hay ingredientes agregados aún.</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="submit" className={styles.btnPrimary} style={{ background: 'var(--success)' }}>
                                <Save size={18} /> Crear Sub-receta
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtros y Búsqueda */}
            <div className={styles.toolbar}>
                <div className={styles.searchContainer}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar sub-receta..."
                        className={styles.searchInput}
                    />
                </div>
                <button className={styles.btnSecondary} style={{ width: 'auto' }}>
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Empty State / List */}
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                {subRecipes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ background: 'var(--bg-primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <ChefHat size={40} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No has creado sub-recetas</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
                            Las sub-recetas te ayudan a estandarizar producciones intermedias (salsas, masas). Agrégalas para usarlas despues en tus platillos.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            {canEdit && (
                                <>
                                    <button onClick={() => setIsAdding(true)} className={styles.btnPrimary} style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}>
                                        Crear mi primera sub-receta
                                    </button>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>o</span>
                                    <button onClick={loadTestData} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}>
                                        🔄 Cargar sub-receta de ejemplo
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Nombre</th>
                                    <th className={styles.th}>Unidad</th>
                                    <th className={styles.th}>Costo Total</th>
                                    {canEdit && <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {subRecipes.map((sub) => (
                                    <tr key={sub.id}>
                                        <td className={styles.td} style={{ fontWeight: 'bold' }}>
                                            {sub.name}
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                                {sub.ingredients.length} ingredientes
                                            </div>
                                        </td>
                                        <td className={styles.td}>{sub.unit}</td>
                                        <td className={styles.td} style={{ fontWeight: 'bold', color: 'var(--success)' }}>${sub.cost.toFixed(2)}</td>
                                        {canEdit && (
                                            <td className={styles.td}>
                                                <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleEditSubRecipe(sub)}
                                                        className={styles.actionBtn}
                                                        title="Editar Sub-receta"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => {
                                                        if (window.confirm("Borrar subreceta?")) {
                                                            setSubRecipes(subRecipes.filter(s => s.id !== sub.id));
                                                        }
                                                    }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubRecipes;

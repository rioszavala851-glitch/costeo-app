import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, ChefHat, X, Save, Trash2, Pencil } from 'lucide-react';
import api from '../api';
import styles from './SubRecipes.module.css';

/**
 * Calcula el costo real de un ingrediente basado en su precio, rendimiento y cantidad.
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
    const [subRecipes, setSubRecipes] = useState([]);
    const { user } = useAuth();
    const canEdit = user?.role !== 'viewer';
    const [isAdding, setIsAdding] = useState(false);

    // State for creating a new sub-recipe
    const [newSubRecipe, setNewSubRecipe] = useState({ name: '', unit: 'lt', yield: 1, cost: 0 });
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingId, setEditingId] = useState(null);

    // Available items (Ingredients + SubRecipes)
    const [availableItems, setAvailableItems] = useState([]);

    const fetchData = async () => {
        try {
            const [ingRes, subRes] = await Promise.all([
                api.get('/ingredients'),
                api.get('/subrecipes')
            ]);

            const ingredientsData = ingRes.data.map(i => ({
                ...i,
                id: i._id,
                price: Number(i.cost) || 0,
                type: 'ingredient'
            }));

            // Pre-process subrecipes to calculate their costs recursively or simply
            const subrecipesData = subRes.data.map(s => ({
                ...s,
                id: s._id,
                price: 0, // Should be calculated
                type: 'subrecipe'
            }));

            // Helper to resolve pricing for subrecipes
            const itemMap = new Map([...ingredientsData.map(i => [i.id, i]), ...subrecipesData.map(s => [s.id, s])]);

            // Need to calculate cost for subrecipes to be useful as items
            subrecipesData.forEach(sub => {
                let subCost = 0;
                if (sub.items && sub.items.length > 0) {
                    subCost = sub.items.reduce((acc, item) => {
                        const itemObj = item.item;
                        if (!itemObj) return acc;

                        const mappedItem = itemMap.get(itemObj._id);
                        const price = mappedItem ? mappedItem.price : (Number(itemObj.cost) || 0);

                        const costData = calculateIngredientCost(
                            price,
                            mappedItem?.yield || itemObj.yield || 100,
                            mappedItem?.unit || itemObj.unit,
                            itemObj.unit,
                            item.quantity
                        );
                        return acc + costData.totalCost;
                    }, 0);
                }
                sub.price = subCost / (sub.yield || 1); // Price per unit
                sub.cost = subCost; // Total cost

                // Update map
                itemMap.set(sub.id, sub);
            });

            setAvailableItems([...ingredientsData, ...subrecipesData]);
            setSubRecipes(subrecipesData);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAdding]);

    // Calculate total cost
    const totalCost = selectedIngredients.reduce((acc, ing) => {
        const costData = calculateIngredientCost(
            ing.price,
            ing.yield || 100,
            ing.priceUnit || ing.unit,
            ing.useUnit || ing.unit,
            ing.quantity
        );
        return acc + costData.totalCost;
    }, 0);

    const handleAddIngredient = (item) => {
        // Prevent adding itself
        if (editingId && item.id === editingId) {
            alert("No puedes agregar la sub-receta a sí misma.");
            return;
        }

        // Prevent duplicates
        if (selectedIngredients.some(i => i.id === item.id)) {
            alert("Este insumo ya está en la lista.");
            return;
        }

        let suggestedUnit = item.unit;
        if (item.unit === 'kg') suggestedUnit = 'gr';
        if (item.unit === 'lt') suggestedUnit = 'ml';

        const quantity = prompt(`Ingrese la cantidad de ${item.name} (en ${suggestedUnit}): `);
        if (quantity && !isNaN(quantity)) {
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    ...item,
                    quantity: parseFloat(quantity),
                    priceUnit: item.unit,
                    useUnit: suggestedUnit,
                    // Preserve type for backend saving
                    type: item.type
                }
            ]);
            setSearchTerm('');
        }
    };

    const handleRemoveIngredient = (id) => {
        setSelectedIngredients(selectedIngredients.filter(i => i.id !== id));
    };

    const handleEditSubRecipe = (sub) => {
        setNewSubRecipe({
            name: sub.name,
            unit: sub.unit,
            yield: sub.yield,
            cost: sub.cost
        });

        // Map backend items to frontend selectedIngredients
        const ingredients = sub.items.map(i => {
            const baseItem = i.item; // Populated object
            if (!baseItem) return null;

            // We need price/yield from baseItem or availableItems
            const freshItem = availableItems.find(ai => ai.id === baseItem._id) || baseItem;

            return {
                ...freshItem,
                id: baseItem._id,
                name: baseItem.name,
                unit: baseItem.unit,
                price: Number(freshItem.price || baseItem.cost || 0),
                yield: Number(freshItem.yield || baseItem.yield || 100),
                quantity: i.quantity, // Usage quantity
                useUnit: baseItem.unit,
                type: i.itemModel === 'Ingredient' ? 'ingredient' : 'subrecipe'
            };
        }).filter(Boolean);

        setSelectedIngredients(ingredients);
        setEditingId(sub.id);
        setIsAdding(true);
    };

    const handleSaveSubRecipe = async (e) => {
        e.preventDefault();

        // Format items for backend
        const itemsPayload = selectedIngredients.map(ing => ({
            item: ing.id,
            itemModel: ing.type === 'ingredient' ? 'Ingredient' : 'SubRecipe',
            quantity: ing.quantity
        }));

        const payload = {
            name: newSubRecipe.name,
            unit: newSubRecipe.unit,
            yield: parseFloat(newSubRecipe.yield),
            items: itemsPayload
        };

        try {
            if (editingId) {
                await api.put(`/subrecipes/${editingId}`, payload);
                alert("Sub-receta actualizada correctamente");
            } else {
                await api.post('/subrecipes', payload);
                alert("Sub-receta creada correctamente");
            }
            fetchData(); // Refresh list

            // Reset Form (Wait for fetch to finish ideally, but this is fine)
            setIsAdding(false);
            setEditingId(null);
            setNewSubRecipe({ name: '', unit: 'lt', yield: 1, cost: 0 });
            setSelectedIngredients([]);
            setSearchTerm('');

        } catch (error) {
            console.error("Error saving subrecipe:", error);
            alert("Error al guardar la sub-receta");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta sub-receta?")) {
            try {
                await api.delete(`/subrecipes/${id}`);
                fetchData();
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Error al eliminar");
            }
        }
    };

    const filteredItems = availableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        item.id !== editingId // Exclude self
    );

    return (
        <div className={styles.container}>
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
                            <button onClick={() => { setIsAdding(true); setEditingId(null); setNewSubRecipe({ name: '', unit: 'lt', yield: 1, cost: 0 }); setSelectedIngredients([]); }} className={styles.btnPrimary}>
                                <Plus size={20} />
                                Agregar Sub-receta
                            </button>
                        </div>
                    )}
                </header>

                {/* Formulario Agregar */}
                {isAdding && (
                    <div className={styles.card}>
                        <div className={styles.header} style={{ marginBottom: '1rem' }}>
                            <h3 className={styles.title} style={{ fontSize: '1.25rem', color: 'var(--accent-color)' }}>{editingId ? 'Editar Sub-receta' : 'Nueva Sub-receta'}</h3>
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
                                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Ingredientes y Sub-recetas</h4>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Search size={18} className={styles.label} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="text"
                                            placeholder="Buscar ingredientes o sub-recetas..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className={styles.input}
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                        {searchTerm && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                                {filteredItems.map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleAddIngredient(item)}
                                                        style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {item.type === 'subrecipe' && <ChefHat size={14} color="var(--accent-color)" />}
                                                            {item.name}
                                                        </span>
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>${Number(item.price).toFixed(2)}/{item.unit}</span>
                                                    </div>
                                                ))}
                                                {filteredItems.length === 0 && <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>No se encontraron resultados.</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Selected Items List */}
                                {selectedIngredients.length > 0 ? (
                                    <>
                                        <div className={styles.tableContainer}>
                                            <table className={styles.table} style={{ fontSize: '0.85rem', minWidth: '600px' }}>
                                                <thead>
                                                    <tr>
                                                        <th className={styles.th}>Insumo</th>
                                                        <th className={styles.th} style={{ textAlign: 'center' }}>Cant.</th>
                                                        <th className={styles.th} style={{ textAlign: 'center' }}>U.M.</th>
                                                        <th className={styles.th} style={{ textAlign: 'center' }}>Rend.</th>
                                                        <th className={styles.th} style={{ textAlign: 'right' }}>Precio</th>
                                                        <th className={styles.th} style={{ textAlign: 'right' }}>P. Real</th>
                                                        <th className={styles.th} style={{ textAlign: 'right' }}>Costo</th>
                                                        <th className={styles.th}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedIngredients.map(ing => {
                                                        const costData = calculateIngredientCost(
                                                            ing.price,
                                                            ing.yield || 100,
                                                            ing.priceUnit || ing.unit,
                                                            ing.useUnit || ing.unit,
                                                            ing.quantity
                                                        );
                                                        return (
                                                            <tr key={ing.id}>
                                                                <td className={styles.td}>
                                                                    {ing.type === 'subrecipe' && <ChefHat size={12} style={{ marginRight: 4 }} />}
                                                                    {ing.name}
                                                                </td>
                                                                <td className={styles.td} style={{ textAlign: 'center' }}>{ing.quantity}</td>
                                                                <td className={styles.td} style={{ textAlign: 'center' }}>{ing.useUnit || ing.unit}</td>
                                                                <td className={styles.td} style={{ textAlign: 'center' }}>{ing.yield || 100}%</td>
                                                                <td className={styles.td} style={{ textAlign: 'right' }}>${Number(ing.price).toFixed(2)}</td>
                                                                <td className={styles.td} style={{ textAlign: 'right', color: 'var(--warning)' }}>${costData.realPrice.toFixed(2)}</td>
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
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                        <td colSpan="6" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>Costo Total:</td>
                                                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--success)', fontSize: '1rem', textAlign: 'right' }}>${totalCost.toFixed(2)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Resumen de Costos por Unidad */}
                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1.25rem',
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-color)', fontSize: '1rem' }}>
                                                📊 Resumen de Costos por Unidad
                                            </h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                {/* Precio por Unidad Principal (lt o kg) */}
                                                <div style={{
                                                    padding: '1rem',
                                                    background: 'var(--bg-card)',
                                                    borderRadius: 'var(--radius)',
                                                    textAlign: 'center',
                                                    border: '1px solid var(--glass-border)'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                        Precio por {newSubRecipe.unit === 'lt' ? 'Litro' : newSubRecipe.unit === 'kg' ? 'Kilogramo' : 'Pieza'}
                                                    </div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                                        ${(totalCost / (parseFloat(newSubRecipe.yield) || 1)).toFixed(2)}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        / {newSubRecipe.unit}
                                                    </div>
                                                </div>

                                                {/* Precio por Unidad Pequeña (ml o gr) - Solo para lt y kg */}
                                                {(newSubRecipe.unit === 'lt' || newSubRecipe.unit === 'kg') && (
                                                    <div style={{
                                                        padding: '1rem',
                                                        background: 'var(--bg-card)',
                                                        borderRadius: 'var(--radius)',
                                                        textAlign: 'center',
                                                        border: '1px solid var(--glass-border)'
                                                    }}>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                            Precio por {newSubRecipe.unit === 'lt' ? 'Mililitro' : 'Gramo'}
                                                        </div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                                            ${((totalCost / (parseFloat(newSubRecipe.yield) || 1)) / 1000).toFixed(4)}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                            / {newSubRecipe.unit === 'lt' ? 'ml' : 'gr'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>No hay insumos agregados.</p>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className={styles.btnPrimary} style={{ background: 'var(--success)' }}>
                                    <Save size={18} /> Guardar Sub-receta
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de Sub-recetas */}
                <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                    {subRecipes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <ChefHat size={40} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <h3 style={{ color: 'var(--text-primary)' }}>No has creado sub-recetas</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Aún no hay preparaciones registradas.</p>
                            {canEdit && (
                                <button onClick={() => { setIsAdding(true); setEditingId(null); setNewSubRecipe({ name: '', unit: 'lt', yield: 1, cost: 0 }); setSelectedIngredients([]); }} className={styles.btnPrimary} style={{ marginTop: '1rem' }}>
                                    Crear mi primera sub-receta
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Nombre</th>
                                        <th className={styles.th}>Unidad</th>
                                        <th className={styles.th}>Costo Total</th>
                                        <th className={styles.th}>Precio/Unidad</th>
                                        <th className={styles.th}>Precio/ml o gr</th>
                                        {canEdit && <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {subRecipes.map((sub) => {
                                        const pricePerUnit = sub.cost / (sub.yield || 1);
                                        const pricePerSmallUnit = pricePerUnit / 1000;
                                        return (
                                            <tr key={sub.id}>
                                                <td className={styles.td} style={{ fontWeight: 'bold' }}>
                                                    {sub.name}
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                                        {sub.items?.length || 0} insumos • Rend: {sub.yield} {sub.unit}
                                                    </div>
                                                </td>
                                                <td className={styles.td}>
                                                    <span style={{
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        color: 'var(--accent-color)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '2rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {sub.unit}
                                                    </span>
                                                </td>
                                                <td className={styles.td} style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                                    ${Number(sub.cost).toFixed(2)}
                                                </td>
                                                <td className={styles.td} style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                                    ${pricePerUnit.toFixed(2)}/{sub.unit}
                                                </td>
                                                <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>
                                                    {(sub.unit === 'lt' || sub.unit === 'kg') ? (
                                                        <span>${pricePerSmallUnit.toFixed(4)}/{sub.unit === 'lt' ? 'ml' : 'gr'}</span>
                                                    ) : (
                                                        <span>-</span>
                                                    )}
                                                </td>
                                                {canEdit && (
                                                    <td className={styles.td}>
                                                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                                                            <button onClick={() => handleEditSubRecipe(sub)} className={styles.actionBtn}>
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button onClick={() => handleDelete(sub.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubRecipes;

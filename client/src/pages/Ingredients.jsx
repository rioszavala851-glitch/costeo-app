import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileSpreadsheet, Search, Filter, Download, Save, X, DollarSign, Ban, CheckCircle, Pencil, ChefHat } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api';
import styles from './Ingredients.module.css';

/**
 * Calcula el costo de un ingrediente/item para una sub-receta
 */
const calculateItemCost = (price, yieldPercent, priceUnit, useUnit, quantity) => {
    const priceNum = Number(price) || 0;
    const yieldNum = Number(yieldPercent) || 100;
    const qtyNum = Number(quantity) || 0;

    // Precio Real = Precio / (Rendimiento / 100)
    const realPrice = yieldNum > 0 ? priceNum / (yieldNum / 100) : priceNum;

    // Determinar unidades
    const priceUnitLower = (priceUnit || '').toLowerCase();
    const useUnitLower = (useUnit || priceUnit || '').toLowerCase();

    // Calcular costo unitario con conversión si es necesario
    let unitCost = realPrice;
    if ((priceUnitLower === 'kg' && useUnitLower === 'gr') ||
        (priceUnitLower === 'lt' && useUnitLower === 'ml')) {
        unitCost = realPrice / 1000;
    } else if ((priceUnitLower === 'gr' && useUnitLower === 'kg') ||
        (priceUnitLower === 'ml' && useUnitLower === 'lt')) {
        unitCost = realPrice * 1000;
    }

    return unitCost * qtyNum;
};

/**
 * Recalcula el costo total de una sub-receta basándose en sus items
 * usando la fórmula de costeo real - Usa la estructura de la API (items)
 */
const recalculateSubRecipeCost = (subRecipe, ingredientsMap) => {
    // La API usa 'items' no 'ingredients'
    if (!subRecipe.items || subRecipe.items.length === 0) {
        return Number(subRecipe.cost) || 0;
    }

    return subRecipe.items.reduce((acc, itemWrapper) => {
        const itemObj = itemWrapper.item; // El item poblado desde la API
        if (!itemObj) return acc;

        // Buscar el ingrediente actualizado en el mapa global usando _id
        const itemId = itemObj._id || itemObj.id;
        const currentIng = ingredientsMap ? ingredientsMap.get(itemId) : null;

        // Usar precio y rendimiento actual si existe, sino el guardado
        const priceNum = currentIng ? (Number(currentIng.price) || 0) : (Number(itemObj.cost) || 0);
        const yieldNum = currentIng ? (Number(currentIng.yield) || 100) : (Number(itemObj.yield) || 100);

        const cost = calculateItemCost(
            priceNum,
            yieldNum,
            itemObj.unit,
            itemObj.unit,
            itemWrapper.quantity
        );

        return acc + cost;
    }, 0);
};

const Ingredients = () => {
    // State for ingredients
    const [ingredients, setIngredients] = useState([]);
    const { user } = useAuth();
    const canEdit = user?.role !== 'viewer';

    // Load sub-recipes from API
    const [subRecipes, setSubRecipes] = useState([]);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newIngredient, setNewIngredient] = useState({ name: '', price: '', unit: 'kg', yield: 100, category: 'general' });

    // Fetch ingredients from API
    const fetchIngredients = async () => {
        try {
            const res = await api.get('/ingredients');
            const data = res.data;

            // Map backend fields to frontend state
            const mapped = data.map(ing => ({
                ...ing,
                id: ing._id, // Use MongoDB _id as frontend id
                price: ing.cost // Map cost to price
            }));
            setIngredients(mapped);
        } catch (error) {
            console.error('Error al cargar ingredientes:', error);
        }
    };

    // Fetch sub-recipes from API
    const fetchSubRecipes = async () => {
        try {
            const res = await api.get('/subrecipes');
            const data = res.data;

            // Map backend fields to frontend state
            const mapped = data.map(sub => ({
                ...sub,
                id: sub._id
            }));
            setSubRecipes(mapped);
        } catch (error) {
            console.error('Error al cargar sub-recetas:', error);
        }
    };

    useEffect(() => {
        fetchIngredients();
        fetchSubRecipes();
    }, []);

    const handleSaveManual = async (e) => {
        e.preventDefault();

        // Prepare payload
        const payload = {
            name: newIngredient.name,
            unit: newIngredient.unit,
            cost: Number(newIngredient.price), // backend expects 'cost' or 'price', we send cost for clarity
            yield: Number(newIngredient.yield),
            category: newIngredient.category,
            isActive: true
        };

        try {
            if (editingId) {
                // UPDATE
                await api.put(`/ingredients/${editingId}`, payload);
                alert("Ingrediente actualizado correctamente");
            } else {
                // CREATE
                await api.post('/ingredients', payload);
                alert("Ingrediente agregado correctamente");
            }
            // Refresh list
            fetchIngredients();
        } catch (error) {
            console.error(error);
            alert("Hubo un error al guardar.");
        }

        setIsAdding(false);
        setEditingId(null);
        setNewIngredient({ name: '', price: '', unit: 'kg', yield: 100, category: 'general' });
    };

    const handleEditIngredient = (ing) => {
        setNewIngredient({
            name: ing.name,
            price: ing.price,
            unit: ing.unit,
            yield: ing.yield,
            category: ing.category || 'general'
        });
        setEditingId(ing.id); // This is the _id from fetching
        setIsAdding(true);
    };

    const handleUpdatePrice = async (id, currentPrice) => {
        const newPrice = prompt("Ingrese el nuevo costo del ingrediente:", currentPrice);
        if (newPrice !== null && !isNaN(newPrice) && newPrice.trim() !== "") {
            try {
                await api.put(`/ingredients/${id}`, { cost: parseFloat(newPrice) });
                fetchIngredients();
            } catch (error) {
                console.error(error);
                alert("Error al actualizar precio");
            }
        }
    };

    const handleToggleActive = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este ingrediente?")) return;

        try {
            await api.delete(`/ingredients/${id}`);
            fetchIngredients();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    };

    // Mock function to download template
    const handleDownloadTemplate = () => {
        const headers = ["Nombre", "Costo", "Unidad", "Rendimiento(%)", "Categoria"];
        const data = [
            ["Tomate", 25.50, "kg", 95, "Vegetales"],
            ["Leche", 18.00, "lt", 100, "Lacteos"],
            ["Harina", 12.50, "kg", 100, "Secos"]
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, "plantilla_ingredientes.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                // Iterate and save to DB
                let count = 0;
                for (const row of jsonData) {
                    const payload = {
                        name: row['Nombre'] || row['nombre'] || 'Sin Nombre',
                        unit: (row['Unidad'] || row['unidad'] || 'kg').toLowerCase(),
                        cost: Number(row['Costo'] || row['costo'] || 0),
                        yield: Number(row['Rendimiento(%)'] || row['rendimiento'] || 100),
                        category: row['Categoria'] || row['categoria'] || 'general',
                        isActive: true
                    };

                    try {
                        await api.post('/ingredients', payload);
                        count++;
                    } catch (err) {
                        console.error("Error saving row:", row, err);
                    }
                }

                alert(`Se importaron ${count} ingredientes exitosamente.`);
                fetchIngredients();
            } catch (error) {
                console.error("Error al leer el archivo:", error);
                alert("Error al procesar el archivo. Asegúrate que sea un Excel válido.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const ingredientsMap = React.useMemo(() => {
        return new Map(ingredients.map(i => [i.id, i]));
    }, [ingredients]);

    return (
        <div className="animate-fade-in">
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <div className={styles.iconBox}>
                        <FileSpreadsheet size={28} color="white" />
                    </div>
                    <div>
                        <h1 className={styles.title}>Ingredientes</h1>
                        <p className={styles.subtitle}>Gestiona tus insumos base y sus costos</p>
                    </div>
                </div>

                <div className={styles.actions}>
                    {/* Botón Descargar Plantilla */}
                    <button onClick={handleDownloadTemplate} className={styles.btnSecondary}>
                        <Download size={18} />
                        Plantilla
                    </button>

                    {/* Botón Importar Excel - Only if canEdit */}
                    {canEdit && (
                        <label className={styles.btnPrimary} style={{ background: 'var(--success)' }}>
                            <FileSpreadsheet size={18} />
                            Importar Excel
                            <input type="file" onChange={handleFileUpload} accept=".csv, .xlsx, .xls" style={{ display: 'none' }} />
                        </label>
                    )}

                    {/* Botón Agregar Manual - Only if canEdit */}
                    {canEdit && (
                        <button onClick={() => setIsAdding(true)} className={styles.btnPrimary}>
                            <Plus size={18} />
                            Agregar Manual
                        </button>
                    )}
                </div>
            </header>

            {/* Formulario Agregar Manual */}
            {isAdding && (
                <div className={styles.card}>
                    <div className={styles.header} style={{ marginBottom: '1rem' }}>
                        <h3 className={styles.title} style={{ fontSize: '1.25rem', color: 'var(--accent-color)' }}>
                            {editingId ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
                        </h3>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); setNewIngredient({ name: '', price: '', unit: 'kg', yield: 100, category: 'general' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSaveManual}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre</label>
                                <input
                                    required
                                    type="text"
                                    value={newIngredient.name}
                                    onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Costo ($)</label>
                                <input
                                    required
                                    type="number"
                                    value={newIngredient.price}
                                    onChange={e => setNewIngredient({ ...newIngredient, price: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Unidad</label>
                                <select
                                    value={newIngredient.unit}
                                    onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="kg">Kilogramo (kg)</option>
                                    <option value="lt">Litro (lt)</option>
                                    <option value="pz">Pieza (pz)</option>
                                    <option value="gr">Gramo (gr)</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rendimiento (%)</label>
                                <input
                                    type="number"
                                    value={newIngredient.yield}
                                    onChange={e => setNewIngredient({ ...newIngredient, yield: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className={styles.btnPrimary} style={{ background: 'var(--success)' }}>
                                <Save size={18} /> Guardar
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
                        placeholder="Buscar ingrediente..."
                        className={styles.searchInput}
                    />
                </div>
                <button className={styles.btnSecondary} style={{ width: 'auto' }}>
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Lista de Ingredientes */}
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                {ingredients.length === 0 ? (
                    <div key="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
                        <Search size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>No hay ingredientes registrados aún.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={() => setIsAdding(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>
                                Agregar mi primer ingrediente
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Nombre</th>
                                    <th className={styles.th}>Costo</th>
                                    <th className={styles.th}>Unidad</th>
                                    <th className={styles.th}>Rendimiento</th>
                                    {canEdit && <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map((ing) => (
                                    <tr key={ing.id}>
                                        <td className={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {ing.name}
                                                {ing.isActive === false && <span style={{ fontSize: '0.7rem', background: 'var(--danger)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>Inactivo</span>}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{ing.category || 'General'}</div>
                                        </td>
                                        <td className={styles.td}>
                                            <strong>${Number(ing.price).toFixed(2)}</strong>
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
                                                {ing.unit}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', width: '80px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${ing.yield}%`, height: '100%', background: ing.yield < 80 ? 'var(--warning)' : 'var(--success)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: ing.yield < 80 ? 'var(--warning)' : 'var(--success)' }}>{ing.yield}%</span>
                                            </div>
                                        </td>
                                        {canEdit && (
                                            <td className={styles.td}>
                                                <div className={styles.actionsCell}>
                                                    <button onClick={() => handleEditIngredient(ing)} className={styles.actionBtn} title="Editar Detalles">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => handleUpdatePrice(ing.id, ing.price)} className={styles.actionBtn} style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)' }} title="Modificar Precio">
                                                        <DollarSign size={18} />
                                                    </button>
                                                    <button onClick={() => handleToggleActive(ing.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title={ing.isActive !== false ? "Inhabilitar" : "Habilitar"}>
                                                        {ing.isActive !== false ? <Ban size={18} /> : <CheckCircle size={18} />}
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

            {/* Sub-recipes Reference Section */}
            {subRecipes.length > 0 && (
                <div style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div className={styles.iconBox} style={{ boxShadow: 'none', background: 'rgba(59, 130, 246, 0.1)' }}>
                            <ChefHat size={24} color="var(--accent-color)" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Costos de Sub-recetas</h2>
                    </div>

                    <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Nombre</th>
                                        <th className={styles.th}>Costo Unitario (Est.)</th>
                                        <th className={styles.th}>Unidad</th>
                                        <th className={styles.th} style={{ textAlign: 'right' }}>Info</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subRecipes.map(sub => {
                                        const recalculatedCost = recalculateSubRecipeCost(sub, ingredientsMap);
                                        const unitCost = recalculatedCost / (parseFloat(sub.yield) || 1);
                                        return (
                                            <tr key={sub.id}>
                                                <td className={styles.td} style={{ fontWeight: '500' }}>{sub.name}</td>
                                                <td className={styles.td} style={{ fontWeight: 'bold' }}>${unitCost.toFixed(2)}</td>
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
                                                <td className={styles.td} style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    Calculado en Sub-recetas
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ingredients;

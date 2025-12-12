import React, { useState, useEffect } from 'react';
import { Plus, FileSpreadsheet, Search, Filter, Download, Save, X, DollarSign, Ban, CheckCircle, Pencil, ChefHat } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './Ingredients.module.css';

/**
 * Recalcula el costo total de una sub-receta basándose en sus ingredientes
 * usando la fórmula de costeo real
 */
const recalculateSubRecipeCost = (subRecipe, ingredientsMap) => {
    if (!subRecipe.ingredients || subRecipe.ingredients.length === 0) {
        return Number(subRecipe.cost) || 0;
    }

    return subRecipe.ingredients.reduce((acc, ing) => {
        // Buscar el ingrediente actualizado en el mapa global
        const currentIng = ingredientsMap ? ingredientsMap.get(ing.id) : null;

        // Usar precio y rendimiento actual si existe, sino el guardado (snapshot)
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

const Ingredients = () => {
    // State for ingredients
    const [ingredients, setIngredients] = useState([]);

    // Load sub-recipes (keeping localStorage for now as requested/out of scope for this specific file refactor, 
    // but ideally should be API too. For now we focus on ingredients sync).
    const [subRecipes, setSubRecipes] = useState(() => {
        const saved = localStorage.getItem('subRecipes');
        return saved ? JSON.parse(saved) : [];
    });

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newIngredient, setNewIngredient] = useState({ name: '', price: '', unit: 'kg', yield: 100, category: 'general' });

    // Fetch ingredients from API
    const fetchIngredients = async () => {
        try {
            const res = await fetch('/api/ingredients');
            if (!res.ok) throw new Error('Error al cargar ingredientes');
            const data = await res.json();

            // Map backend fields to frontend state
            const mapped = data.map(ing => ({
                ...ing,
                id: ing._id, // Use MongoDB _id as frontend id
                price: ing.cost // Map cost to price
            }));
            setIngredients(mapped);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchIngredients();
    }, []);

    // Also reload whenever subRecipes change if needed, but for now just initial load.

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
                const res = await fetch(`/api/ingredients/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Error al actualizar');
                alert("Ingrediente actualizado correctamente");
            } else {
                // CREATE
                const res = await fetch('/api/ingredients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Error al crear');
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
                const res = await fetch(`/api/ingredients/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cost: parseFloat(newPrice) })
                });
                if (res.ok) {
                    fetchIngredients();
                } else {
                    alert("Error al actualizar precio");
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleToggleActive = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este ingrediente?")) return;

        try {
            const res = await fetch(`/api/ingredients/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchIngredients();
            } else {
                alert("Error al eliminar");
            }
        } catch (error) {
            console.error(error);
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
                        await fetch('/api/ingredients', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
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
            <div className={styles.header}>
                <h1 className={styles.title}>Ingredientes</h1>

                <div className={styles.actions}>
                    {/* Botón Descargar Plantilla */}
                    <button
                        onClick={handleDownloadTemplate}
                        className="btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Download size={18} />
                        Plantilla
                    </button>

                    {/* Botón Importar Excel */}
                    <label
                        className="btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--success)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <FileSpreadsheet size={18} />
                        Importar Excel
                        <input type="file" onChange={handleFileUpload} accept=".csv, .xlsx, .xls" style={{ display: 'none' }} />
                    </label>

                    {/* Botón Agregar Manual */}
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--accent-color)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Plus size={18} />
                        Agregar Manual
                    </button>
                </div>
            </div>

            {/* Formulario Agregar Manual */}
            {isAdding && (
                <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--accent-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{editingId ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</h3>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); setNewIngredient({ name: '', price: '', unit: 'kg', yield: 100, category: 'general' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSaveManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre</label>
                            <input
                                required
                                type="text"
                                value={newIngredient.name}
                                onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Costo ($)</label>
                            <input
                                required
                                type="number"
                                value={newIngredient.price}
                                onChange={e => setNewIngredient({ ...newIngredient, price: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Unidad</label>
                            <select
                                value={newIngredient.unit}
                                onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                            >
                                <option value="kg">Kilogramo (kg)</option>
                                <option value="lt">Litro (lt)</option>
                                <option value="pz">Pieza (pz)</option>
                                <option value="gr">Gramo (gr)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rendimiento (%)</label>
                            <input
                                type="number"
                                value={newIngredient.yield}
                                onChange={e => setNewIngredient({ ...newIngredient, yield: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="submit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--success)', border: 'none', padding: '0.5rem 1.5rem', borderRadius: 'var(--radius)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                <Save size={18} /> Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtros y Búsqueda */}
            <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar ingrediente..."
                        className={styles.searchInput}
                    />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Lista de Ingredientes */}
            <div className="card">
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
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Nombre</th>
                                    <th className={styles.th}>Costo</th>
                                    <th className={styles.th}>Unidad</th>
                                    <th className={styles.th}>Rendimiento</th>
                                    <th className={styles.th}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map((ing) => (
                                    <tr key={ing.id} className={`${styles.row} ${ing.isActive === false ? styles.rowInactive : ''}`}>
                                        <td className={styles.tdFirst} data-label="Nombre">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {ing.name}
                                                {ing.isActive === false && <span style={{ fontSize: '0.7rem', background: 'var(--danger)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>Inactivo</span>}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{ing.category || 'General'}</div>
                                        </td>
                                        <td className={styles.td} data-label="Costo">
                                            <strong>${Number(ing.price).toFixed(2)}</strong>
                                        </td>
                                        <td className={styles.td} data-label="Unidad">
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
                                        <td className={styles.td} data-label="Rendimiento">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', width: '80px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${ing.yield}%`, height: '100%', background: ing.yield < 80 ? 'var(--warning)' : 'var(--success)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: ing.yield < 80 ? 'var(--warning)' : 'var(--success)' }}>{ing.yield}%</span>
                                            </div>
                                        </td>
                                        <td className={styles.tdLast} data-label="Acciones">
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEditIngredient(ing)}
                                                    title="Editar Detalles"
                                                    style={{
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        border: '1px solid var(--accent-color)',
                                                        cursor: 'pointer',
                                                        color: 'var(--accent-color)',
                                                        padding: '0.4rem',
                                                        borderRadius: '0.5rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdatePrice(ing.id, ing.price)}
                                                    title="Modificar Precio"
                                                    style={{
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        border: '1px solid var(--success)',
                                                        cursor: 'pointer',
                                                        color: 'var(--success)',
                                                        padding: '0.4rem',
                                                        borderRadius: '0.5rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <DollarSign size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(ing.id)}
                                                    title={ing.isActive !== false ? "Inhabilitar" : "Habilitar"}
                                                    style={{
                                                        background: ing.isActive !== false ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                                        border: ing.isActive !== false ? '1px solid var(--danger)' : '1px solid var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        color: ing.isActive !== false ? 'var(--danger)' : 'var(--text-secondary)',
                                                        padding: '0.4rem',
                                                        borderRadius: '0.5rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    {ing.isActive !== false ? <Ban size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                            </div>
                                        </td>
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
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChefHat size={24} color="var(--accent-color)" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Costos de Sub-recetas</h2>
                    </div>

                    <div className="card">
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.8rem', color: 'var(--text-primary)' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0 1.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Nombre</th>
                                    <th style={{ padding: '0 1rem', fontWeight: '500', fontSize: '0.9rem' }}>Costo Unitario (Est.)</th>
                                    <th style={{ padding: '0 1rem', fontWeight: '500', fontSize: '0.9rem' }}>Unidad</th>
                                    <th style={{ padding: '0 1.5rem', fontWeight: '500', fontSize: '0.9rem', textAlign: 'right' }}>Info</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subRecipes.map(sub => {
                                    const recalculatedCost = recalculateSubRecipeCost(sub, ingredientsMap);
                                    const unitCost = recalculatedCost / (parseFloat(sub.yield) || 1);
                                    return (
                                        <tr key={sub.id} style={{
                                            background: 'rgba(59, 130, 246, 0.05)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            borderLeft: '3px solid var(--accent-color)'
                                        }}>
                                            <td style={{ padding: '1rem 1.5rem', borderTopLeftRadius: '1rem', borderBottomLeftRadius: '1rem', fontWeight: '500' }}>
                                                {sub.name}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                                ${unitCost.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
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
                                            <td style={{ padding: '1rem 1.5rem', borderTopRightRadius: '1rem', borderBottomRightRadius: '1rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                Calculado en Sub-recetas
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ingredients;

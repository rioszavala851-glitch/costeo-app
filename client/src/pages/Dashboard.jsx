import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ChefHat, UtensilsCrossed, TrendingUp, TrendingDown, DollarSign, Package, Plus, FilePlus, Cherry, Tag, X } from 'lucide-react';
import api from '../api';
import styles from './Dashboard.module.css';

/**
 * Calcula el costo de un ingrediente/item para una sub-receta
 */
const calculateItemCost = (price, yieldPercent, priceUnit, useUnit, quantity) => {
    const priceNum = Number(price) || 0;
    const yieldNum = Number(yieldPercent) || 100;
    const qtyNum = Number(quantity) || 0;

    const realPrice = yieldNum > 0 ? priceNum / (yieldNum / 100) : priceNum;

    const priceUnitLower = (priceUnit || '').toLowerCase();
    const useUnitLower = (useUnit || priceUnit || '').toLowerCase();

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

// Componente para Estados Vacíos
const EmptyState = ({ icon: Icon, title, description, buttonText, onAction }) => (
    <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
            <Icon size={64} strokeWidth={1} />
        </div>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</h4>
        <p className={styles.emptyText}>{description}</p>
        <button className={styles.ctaButton} onClick={onAction}>
            <Plus size={18} />
            {buttonText}
        </button>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [ingredients, setIngredients] = useState([]);
    const [subRecipes, setSubRecipes] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fabOpen, setFabOpen] = useState(false);
    const fabRef = useRef(null);

    // Cerrar FAB al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fabRef.current && !fabRef.current.contains(event.target)) {
                setFabOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ingRes, subRes, recipeRes] = await Promise.all([
                    api.get('/ingredients'),
                    api.get('/subrecipes'),
                    api.get('/recipes')
                ]);

                // Process ingredients
                const ingredientsData = ingRes.data.map(i => ({
                    ...i,
                    id: i._id,
                    price: Number(i.cost) || 0
                }));
                setIngredients(ingredientsData);

                // Create ingredients map for cost calculation
                const ingredientsMap = new Map(ingredientsData.map(i => [i.id, i]));

                // Process sub-recipes and calculate their costs
                const subRecipesData = subRes.data.map(sub => {
                    let totalCost = 0;

                    if (sub.items && sub.items.length > 0) {
                        totalCost = sub.items.reduce((acc, itemWrapper) => {
                            const itemObj = itemWrapper.item;
                            if (!itemObj) return acc;

                            const itemId = itemObj._id || itemObj.id;
                            const mappedItem = ingredientsMap.get(itemId) || itemObj;
                            const price = Number(mappedItem.price || mappedItem.cost || 0);
                            const yieldPercent = Number(mappedItem.yield || itemObj.yield || 100);

                            const cost = calculateItemCost(
                                price,
                                yieldPercent,
                                itemObj.unit,
                                itemObj.unit,
                                itemWrapper.quantity
                            );

                            return acc + cost;
                        }, 0);
                    }

                    return {
                        ...sub,
                        id: sub._id,
                        cost: totalCost,
                        unitCost: totalCost / (sub.yield || 1)
                    };
                });
                setSubRecipes(subRecipesData);

                // Create subrecipes map for recipe cost calculation
                const subRecipesMap = new Map(subRecipesData.map(s => [s.id, s]));

                // Process recipes and calculate their costs
                // Handle new response structure: recipeRes.data is now {recipes, limits}
                const recipesList = recipeRes.data.recipes || recipeRes.data;
                const recipesData = recipesList.map(recipe => {
                    let totalCost = 0;

                    if (recipe.items && recipe.items.length > 0) {
                        totalCost = recipe.items.reduce((acc, itemWrapper) => {
                            const itemObj = itemWrapper.item;
                            if (!itemObj) return acc;

                            const itemId = itemObj._id || itemObj.id;
                            const isSubRecipe = itemWrapper.itemModel === 'SubRecipe';

                            let price = 0;
                            let yieldPercent = 100;

                            if (isSubRecipe) {
                                // Get sub-recipe cost per unit
                                const subRecipe = subRecipesMap.get(itemId);
                                price = subRecipe ? subRecipe.unitCost : 0;
                                yieldPercent = 100; // Sub-recipes always 100% yield
                            } else {
                                // Get ingredient
                                const ingredient = ingredientsMap.get(itemId) || itemObj;
                                price = Number(ingredient.price || ingredient.cost || 0);
                                yieldPercent = Number(ingredient.yield || itemObj.yield || 100);
                            }

                            const cost = calculateItemCost(
                                price,
                                yieldPercent,
                                itemObj.unit,
                                itemObj.unit,
                                itemWrapper.quantity
                            );

                            return acc + cost;
                        }, 0);
                    }

                    const costPerPortion = totalCost / (recipe.quantity || 1);
                    const suggestedPrice = costPerPortion * (recipe.utilityFactor || 1);

                    return {
                        ...recipe,
                        id: recipe._id,
                        totalCost,
                        costPerPortion,
                        suggestedPrice,
                        sellingPrice: recipe.suggestedPrice || suggestedPrice
                    };
                });
                setRecipes(recipesData);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Statistics
    const totalIngredients = ingredients.length;
    const totalSubRecipes = subRecipes.length;
    const totalRecipes = recipes.length;
    const avgRecipeMargin = recipes.length > 0
        ? recipes.reduce((acc, r) => {
            const margin = r.sellingPrice > 0 ? ((r.sellingPrice - r.costPerPortion) / r.sellingPrice) * 100 : 0;
            return acc + margin;
        }, 0) / recipes.length
        : 0;

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className="animate-fade-in">
                <div className={styles.header}>
                    <div style={{ background: 'var(--accent-color)', padding: '0.75rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                        <LayoutDashboard size={28} color="white" />
                    </div>
                    <div className={styles.titleContainer}>
                        <h1 className={styles.title}>Dashboard</h1>
                        <p className={styles.subtitle}>Resumen general de tu sistema de costeo</p>
                    </div>
                </div>

                {/* Summary Cards - Clickable KPIs */}
                <div className={styles.statsGrid}>
                    <div
                        className={`card ${styles.statCard} ${styles.statCardClickable}`}
                        style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                        onClick={() => navigate('/ingredients')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.statHeader}>
                            <div>
                                <p className={styles.statLabel}>Ingredientes</p>
                                <h2 className={styles.statValue}>{totalIngredients}</h2>
                            </div>
                            <Package size={32} color="var(--accent-color)" style={{ opacity: 0.7 }} />
                        </div>
                        <p className={styles.statHint}>Click para ver todos</p>
                    </div>
                    <div
                        className={`card ${styles.statCard} ${styles.statCardClickable}`}
                        style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                        onClick={() => navigate('/subrecipes')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.statHeader}>
                            <div>
                                <p className={styles.statLabel}>Sub-recetas</p>
                                <h2 className={styles.statValue}>{totalSubRecipes}</h2>
                            </div>
                            <ChefHat size={32} color="#8b5cf6" style={{ opacity: 0.7 }} />
                        </div>
                        <p className={styles.statHint}>Click para ver todos</p>
                    </div>
                    <div
                        className={`card ${styles.statCard} ${styles.statCardClickable}`}
                        style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                        onClick={() => navigate('/recipes')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.statHeader}>
                            <div>
                                <p className={styles.statLabel}>Recetas</p>
                                <h2 className={styles.statValue}>{totalRecipes}</h2>
                            </div>
                            <UtensilsCrossed size={32} color="var(--success)" style={{ opacity: 0.7 }} />
                        </div>
                        <p className={styles.statHint}>Click para ver todos</p>
                    </div>
                    <div
                        className={`card ${styles.statCard}`}
                        style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                    >
                        <div className={styles.statHeader}>
                            <div>
                                <p className={styles.statLabel}>Margen Promedio</p>
                                <h2 className={styles.statValue} style={{
                                    color: avgRecipeMargin >= 30 ? 'var(--success)' : avgRecipeMargin >= 15 ? '#f59e0b' : 'var(--danger)'
                                }}>
                                    {avgRecipeMargin.toFixed(1)}%
                                </h2>
                            </div>
                            {avgRecipeMargin >= 30 ? (
                                <TrendingUp size={32} color="var(--success)" style={{ opacity: 0.9 }} />
                            ) : avgRecipeMargin >= 15 ? (
                                <TrendingUp size={32} color="#f59e0b" style={{ opacity: 0.7 }} />
                            ) : (
                                <TrendingDown size={32} color="var(--danger)" style={{ opacity: 0.9 }} />
                            )}
                        </div>
                        <p className={styles.statTrend} style={{
                            color: avgRecipeMargin >= 30 ? 'var(--success)' : avgRecipeMargin >= 15 ? '#f59e0b' : 'var(--danger)'
                        }}>
                            {avgRecipeMargin >= 30 ? '✅ Excelente margen' : avgRecipeMargin >= 15 ? '⚠️ Margen aceptable' : '❌ Margen bajo'}
                        </p>
                    </div>
                </div>

                {/* Sub-Recipes Section */}
                <div className={`card ${styles.section}`}>
                    <div className={styles.sectionHeader}>
                        <ChefHat size={24} color="#8b5cf6" />
                        <h3 className={styles.sectionTitle}>Sub-recetas</h3>
                    </div>
                    {subRecipes.length === 0 ? (
                        <EmptyState
                            icon={ChefHat}
                            title="No tienes sub-recetas"
                            description="Agrupa ingredientes comunes (como salsas o masas) para usarlos en múltiples platillos."
                            buttonText="Crear Sub-receta"
                            onAction={() => navigate('/subrecipes')}
                        />
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Nombre</th>
                                        <th className={styles.th}>Costo Total</th>
                                        <th className={styles.th}>Rendimiento</th>
                                        <th className={styles.th}>Costo Unitario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subRecipes.slice(0, 5).map(sub => (
                                        <tr key={sub.id}>
                                            <td className={styles.td} style={{ fontWeight: '500' }}>{sub.name}</td>
                                            <td className={styles.td}>${(sub.cost || 0).toFixed(2)}</td>
                                            <td className={styles.td}>{sub.yield} {sub.unit}</td>
                                            <td className={styles.td} style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                                ${(sub.unitCost || 0).toFixed(2)}/{sub.unit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {subRecipes.length > 5 && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>
                                    + {subRecipes.length - 5} sub-recetas más...
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Recipes Section */}
                <div className={`card ${styles.section}`}>
                    <div className={styles.sectionHeader}>
                        <UtensilsCrossed size={24} color="var(--success)" />
                        <h3 className={styles.sectionTitle}>Recetas / Platillos</h3>
                    </div>
                    {recipes.length === 0 ? (
                        <EmptyState
                            icon={UtensilsCrossed}
                            title="No tienes recetas todavía"
                            description="Comienza a calcular tus costos ahora creando tu primer platillo completo."
                            buttonText="Crear Nueva Receta"
                            onAction={() => navigate('/recipes')}
                        />
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Platillo</th>
                                        <th className={styles.th}>Costo</th>
                                        <th className={styles.th}>Precio Venta</th>
                                        <th className={styles.th}>Margen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipes.slice(0, 5).map(r => {
                                        const margin = r.sellingPrice > 0 ? ((r.sellingPrice - r.costPerPortion) / r.sellingPrice) * 100 : 0;
                                        return (
                                            <tr key={r.id}>
                                                <td className={styles.td} style={{ fontWeight: '500' }}>{r.name}</td>
                                                <td className={styles.td}>${(r.costPerPortion || 0).toFixed(2)}</td>
                                                <td className={styles.td}>${(r.sellingPrice || 0).toFixed(2)}</td>
                                                <td className={styles.td}>
                                                    <span style={{
                                                        color: margin > 30 ? 'var(--success)' : (margin > 0 ? 'var(--warning)' : 'var(--danger)'),
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {recipes.length > 5 && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>
                                    + {recipes.length - 5} recetas más...
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button (FAB) */}
            <div className={styles.fabContainer} ref={fabRef}>
                {/* Menu de acciones rápidas */}
                <div className={`${styles.fabMenu} ${fabOpen ? styles.fabMenuOpen : ''}`}>
                    <button
                        className={styles.fabMenuItem}
                        onClick={() => { navigate('/ingredients'); setFabOpen(false); }}
                    >
                        <Cherry size={20} />
                        <span>Nuevo Ingrediente</span>
                    </button>
                    <button
                        className={styles.fabMenuItem}
                        onClick={() => { navigate('/recipes'); setFabOpen(false); }}
                    >
                        <UtensilsCrossed size={20} />
                        <span>Nueva Receta</span>
                    </button>
                    <button
                        className={styles.fabMenuItem}
                        onClick={() => { navigate('/categories'); setFabOpen(false); }}
                    >
                        <Tag size={20} />
                        <span>Nueva Categoría</span>
                    </button>
                </div>

                {/* Botón principal FAB */}
                <button
                    className={`${styles.fab} ${fabOpen ? styles.fabActive : ''}`}
                    onClick={() => setFabOpen(!fabOpen)}
                    aria-label="Acciones rápidas"
                >
                    {fabOpen ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>
        </div>
    );
};

export default Dashboard;

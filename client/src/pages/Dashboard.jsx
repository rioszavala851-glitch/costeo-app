import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ChefHat, UtensilsCrossed, TrendingUp, DollarSign, Package } from 'lucide-react';

const Dashboard = () => {
    const [ingredients, setIngredients] = useState([]);
    const [subRecipes, setSubRecipes] = useState([]);
    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        const savedIngredients = localStorage.getItem('ingredients');
        const savedSubRecipes = localStorage.getItem('subRecipes');
        const savedRecipes = localStorage.getItem('recipes');

        if (savedIngredients) setIngredients(JSON.parse(savedIngredients));
        if (savedSubRecipes) setSubRecipes(JSON.parse(savedSubRecipes));
        if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
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

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--accent-color)', padding: '0.75rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                    <LayoutDashboard size={28} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Dashboard</h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Resumen general de tu sistema de costeo</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Ingredientes</p>
                            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{totalIngredients}</h2>
                        </div>
                        <Package size={32} color="var(--accent-color)" style={{ opacity: 0.7 }} />
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Sub-recetas</p>
                            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{totalSubRecipes}</h2>
                        </div>
                        <ChefHat size={32} color="#8b5cf6" style={{ opacity: 0.7 }} />
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Recetas</p>
                            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{totalRecipes}</h2>
                        </div>
                        <UtensilsCrossed size={32} color="var(--success)" style={{ opacity: 0.7 }} />
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Margen Promedio</p>
                            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{avgRecipeMargin.toFixed(1)}%</h2>
                        </div>
                        <TrendingUp size={32} color="#f59e0b" style={{ opacity: 0.7 }} />
                    </div>
                </div>
            </div>

            {/* Sub-Recipes Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <ChefHat size={24} color="#8b5cf6" />
                    <h3 style={{ margin: 0 }}>Sub-recetas</h3>
                </div>
                {subRecipes.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay sub-recetas creadas aún.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem' }}>Nombre</th>
                                    <th style={{ padding: '0.75rem' }}>Costo Total</th>
                                    <th style={{ padding: '0.75rem' }}>Rendimiento</th>
                                    <th style={{ padding: '0.75rem' }}>Costo Unitario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subRecipes.slice(0, 5).map(sub => (
                                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{sub.name}</td>
                                        <td style={{ padding: '0.75rem' }}>${(sub.cost || 0).toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem' }}>{sub.yield} {sub.unit}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>
                                            ${((sub.cost || 0) / (parseFloat(sub.yield) || 1)).toFixed(2)}/{sub.unit}
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
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <UtensilsCrossed size={24} color="var(--success)" />
                    <h3 style={{ margin: 0 }}>Recetas / Platillos</h3>
                </div>
                {recipes.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay recetas creadas aún.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem' }}>Platillo</th>
                                    <th style={{ padding: '0.75rem' }}>Costo</th>
                                    <th style={{ padding: '0.75rem' }}>Precio Venta</th>
                                    <th style={{ padding: '0.75rem' }}>Margen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes.slice(0, 5).map(r => {
                                    const margin = r.sellingPrice > 0 ? ((r.sellingPrice - r.costPerPortion) / r.sellingPrice) * 100 : 0;
                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{r.name}</td>
                                            <td style={{ padding: '0.75rem' }}>${(r.costPerPortion || 0).toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem' }}>${(r.sellingPrice || 0).toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem' }}>
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
    );
};

export default Dashboard;

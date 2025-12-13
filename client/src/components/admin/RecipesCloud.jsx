import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Cloud, Download } from 'lucide-react';

const RecipesCloud = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const res = await api.get('/cloud-recipes');
            setRecipes(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching cloud recipes:', error);
            // Fallback for demo if API fails
            setRecipes([]);
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        // Proceed to upload logic (placeholder)
        alert("¡Función de subida lista!");
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3>Nube de Recetas (Marketplace)</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Comparte tus mejores recetas con la comunidad.
                    </p>
                </div>
                <button
                    onClick={handleUploadClick}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, var(--accent-color) 0%, #4ade80 100%)',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(74, 222, 128, 0.3)'
                    }}
                >
                    <Cloud size={20} />
                    Subir Receta
                </button>
            </div>

            {loading ? <p>Cargando recetas de la nube...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {recipes.map(recipe => (
                        <div key={recipe._id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <Cloud size={24} color="var(--accent-color)" />
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>{recipe.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                {recipe.description || 'Sin descripción'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto' }}>
                                <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                                    <Download size={16} /> Obtener
                                </button>
                            </div>
                        </div>
                    ))}
                    {recipes.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                            <Cloud size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-secondary)' }}>No hay recetas disponibles en la nube por ahora.</p>
                            <button onClick={handleUploadClick} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                                Sé el primero en subir una
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecipesCloud;

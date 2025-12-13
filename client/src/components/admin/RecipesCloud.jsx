import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Cloud, Download, DollarSign } from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';

const RecipesCloud = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPlans, setShowPlans] = useState(false);
    const { hasFeature } = usePlan();

    const isSubscribed = hasFeature('cloudSync');

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
        if (!isSubscribed) {
            setShowPlans(true);
        } else {
            // Proceed to upload logic (placeholder)
            alert("¡Función de subida lista!");
        }
    };

    const plans = [
        {
            months: 3,
            price: 14.99,
            label: 'Trimestral',
            popular: false,
            features: ['Subida ilimitada', 'Sincronización básica', 'Soporte por email']
        },
        {
            months: 6,
            price: 24.99,
            label: 'Semestral',
            popular: true,
            features: ['Todo lo del Trimestral', 'Prioridad en búsquedas', 'Badge de Verificado']
        },
        {
            months: 12,
            price: 39.99,
            label: 'Anual',
            popular: false,
            features: ['Todo incluido', 'Soporte 24/7', 'Acceso a API Beta', 'Ahorro máximo']
        },
    ];

    if (showPlans) {
        return (
            <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setShowPlans(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        ← Volver
                    </button>
                    <h2 style={{ margin: 0 }}>Elige tu Plan de Nube</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', padding: '1rem 0' }}>
                    {plans.map((plan) => (
                        <div
                            key={plan.months}
                            style={{
                                background: plan.popular ? 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)' : 'var(--bg-secondary)',
                                border: plan.popular ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                borderRadius: '1rem',
                                padding: '2rem',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                boxShadow: plan.popular ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none',
                                transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {plan.popular && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--accent-color)',
                                    color: '#fff',
                                    padding: '0.25rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    Más Popular
                                </span>
                            )}

                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.label}</h3>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>${plan.price}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>/mes</span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Facturado cada {plan.months} meses</p>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', flex: 1 }}>
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                                        <div style={{ background: 'var(--success)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ color: 'white', fontSize: '10px' }}>✓</span>
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    setShowPlans(false);
                                    alert(`Has seleccionado el plan ${plan.label}. Contacta a ventas para activar tu cuenta.`);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: plan.popular ? 'none' : '1px solid var(--glass-border)',
                                    background: plan.popular ? 'var(--accent-color)' : 'var(--bg-card)',
                                    color: plan.popular ? 'white' : 'var(--text-primary)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Seleccionar Plan
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3>Nube de Recetas (Marketplace)</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Comparte y monetiza tus mejores recetas con la comunidad.
                    </p>
                </div>
                <button
                    onClick={handleUploadClick}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, var(--accent-color) 0%, #ff6b6b 100%)',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
                    }}
                >
                    <Cloud size={20} />
                    {isSubscribed ? 'Subir Receta' : 'Subir a la Nube (Premium)'}
                </button>
            </div>

            {loading ? <p>Cargando recetas de la nube...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {recipes.map(recipe => (
                        <div key={recipe._id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <Cloud size={24} color="var(--accent-color)" />
                                {recipe.isPaid && (
                                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: 'var(--warning)', fontWeight: 'bold' }}>
                                        <DollarSign size={14} /> Premium
                                    </span>
                                )}
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>{recipe.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                {recipe.description || 'Sin descripción'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    ${recipe.price?.toFixed(2) || '0.00'}
                                </span>
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

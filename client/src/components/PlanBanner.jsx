import React from 'react';
import { usePlan } from '../contexts/PlanContext';
import { Crown, AlertTriangle, Sparkles } from 'lucide-react';

const PlanBanner = ({ isOpen }) => {
    const { planStatus, isPremium, loading } = usePlan();

    if (loading || !planStatus) return null;

    const recipeLimits = planStatus.limits?.recipes || { max: 30, current: 0, remaining: 30, percentage: 0 };
    const isNearLimit = recipeLimits.remaining <= 5 && !isPremium;
    const isAtLimit = recipeLimits.remaining === 0 && !isPremium;

    if (!isOpen) {
        // Collapsed sidebar - show icon only
        return (
            <div style={{
                padding: '0.5rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {isPremium ? (
                    <Crown size={20} color="#f59e0b" />
                ) : isAtLimit ? (
                    <AlertTriangle size={20} color="var(--danger)" />
                ) : (
                    <Sparkles size={20} color="var(--text-secondary)" />
                )}
            </div>
        );
    }

    // Premium user banner
    if (isPremium) {
        return (
            <div style={{
                margin: '0.75rem',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.1))',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Crown size={16} color="#f59e0b" />
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#f59e0b' }}>
                        Premium
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Recetas ilimitadas
                </p>
            </div>
        );
    }

    // Free user banner
    return (
        <div style={{
            margin: '0.75rem',
            padding: '0.75rem',
            background: isAtLimit
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))'
                : isNearLimit
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.1))'
                    : 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius)',
            border: `1px solid ${isAtLimit ? 'rgba(239, 68, 68, 0.3)' : isNearLimit ? 'rgba(245, 158, 11, 0.3)' : 'var(--glass-border)'}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Plan Gratuito</span>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: isAtLimit ? 'var(--danger)' : isNearLimit ? 'var(--warning)' : 'var(--text-primary)'
                }}>
                    {recipeLimits.current}/{recipeLimits.max}
                </span>
            </div>

            {/* Progress bar */}
            <div style={{
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
            }}>
                <div style={{
                    width: `${Math.min(100, recipeLimits.percentage)}%`,
                    height: '100%',
                    background: isAtLimit
                        ? 'var(--danger)'
                        : isNearLimit
                            ? 'var(--warning)'
                            : 'var(--accent-color)',
                    transition: 'width 0.3s ease'
                }} />
            </div>

            {isAtLimit ? (
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--danger)' }}>
                    ¡Límite alcanzado!
                </p>
            ) : isNearLimit ? (
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--warning)' }}>
                    Quedan {recipeLimits.remaining} recetas
                </p>
            ) : (
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {recipeLimits.remaining} recetas disponibles
                </p>
            )}

            {/* Upgrade button */}
            <button
                onClick={() => alert('Próximamente: Actualiza a Premium para recetas ilimitadas y todas las funciones.')}
                style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    padding: '0.5rem',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Crown size={14} />
                Actualizar a Premium
            </button>
        </div>
    );
};

export default PlanBanner;

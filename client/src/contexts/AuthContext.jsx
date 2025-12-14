import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Tiempo de inactividad antes de cerrar sesión (15 minutos en milisegundos)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
// Tiempo de advertencia antes del cierre (1 minuto antes)
const WARNING_TIME = 1 * 60 * 1000;

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [showInactivityWarning, setShowInactivityWarning] = useState(false);

    const inactivityTimerRef = useRef(null);
    const warningTimerRef = useRef(null);

    // Configure axios defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    }, [token]);

    // Función para cerrar sesión por inactividad
    const logoutDueToInactivity = useCallback(() => {
        setShowInactivityWarning(false);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        // Mostrar mensaje al usuario
        alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
    }, []);

    // Función para resetear el timer de inactividad
    const resetInactivityTimer = useCallback(() => {
        // Limpiar timers existentes
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
        }

        setShowInactivityWarning(false);

        // Solo activar si el usuario está autenticado
        if (token && user) {
            // Timer para mostrar advertencia
            warningTimerRef.current = setTimeout(() => {
                setShowInactivityWarning(true);
            }, INACTIVITY_TIMEOUT - WARNING_TIME);

            // Timer para cerrar sesión
            inactivityTimerRef.current = setTimeout(() => {
                logoutDueToInactivity();
            }, INACTIVITY_TIMEOUT);
        }
    }, [token, user, logoutDueToInactivity]);

    // Eventos de actividad del usuario
    useEffect(() => {
        if (!token || !user) return;

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            resetInactivityTimer();
        };

        // Agregar listeners
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Iniciar el timer
        resetInactivityTimer();

        // Cleanup
        return () => {
            activityEvents.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            if (warningTimerRef.current) {
                clearTimeout(warningTimerRef.current);
            }
        };
    }, [token, user, resetInactivityTimer]);

    // Load user on mount if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const response = await axios.get('/api/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const { token: newToken, user: userData } = response.data;

            setToken(newToken);
            setUser(userData);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al iniciar sesión'
            };
        }
    };

    const logout = () => {
        // Limpiar timers al cerrar sesión manualmente
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
        }
        setShowInactivityWarning(false);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    // Función para extender la sesión cuando se muestra la advertencia
    const extendSession = () => {
        setShowInactivityWarning(false);
        resetInactivityTimer();
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        showInactivityWarning,
        extendSession
    };

    return (
        <AuthContext.Provider value={value}>
            {children}

            {/* Modal de advertencia de inactividad */}
            {showInactivityWarning && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'var(--bg-card, #1e293b)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid var(--warning, #f59e0b)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
                        <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--warning, #f59e0b)' }}>
                            ¿Sigues ahí?
                        </h2>
                        <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>
                            Tu sesión se cerrará automáticamente en <strong style={{ color: 'var(--danger, #ef4444)' }}>1 minuto</strong> por inactividad.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={logout}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'transparent',
                                    border: '1px solid var(--glass-border, #334155)',
                                    color: 'var(--text-secondary, #94a3b8)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Cerrar Sesión
                            </button>
                            <button
                                onClick={extendSession}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'var(--accent-color, #3b82f6)',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Continuar Trabajando
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

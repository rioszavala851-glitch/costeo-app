import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat, Lock, Mail, AlertCircle, Eye, EyeOff, Loader2, ChevronDown, UserCircle } from 'lucide-react';
import styles from './Login.module.css';

// Demo credentials - only shown in development
const DEMO_CREDENTIALS = [
    { role: 'Admin', email: 'admin@costeo.com', password: 'admin', color: '#667eea' },
    { role: 'Aux. Admin', email: 'aux@costeo.com', password: 'aux', color: '#10b981' },
    { role: 'Chef', email: 'chef@costeo.com', password: 'chef', color: '#f59e0b' }
];

const isDevelopment = import.meta.env.DEV;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });
    const [showDemoCredentials, setShowDemoCredentials] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Load remembered email on mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const validateForm = () => {
        const errors = { email: false, password: false };
        let isValid = true;

        if (!email || !email.includes('@')) {
            errors.email = true;
            isValid = false;
        }
        if (!password || password.length < 3) {
            errors.password = true;
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            setError('Por favor, completa todos los campos correctamente.');
            return;
        }

        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            navigate('/');
        } else {
            setError(result.message || 'Usuario o contraseña incorrectos');
            setFieldErrors({ email: true, password: true });
        }

        setLoading(false);
    };

    const handleForgotPassword = () => {
        alert('Funcionalidad de recuperación de contraseña próximamente. Por favor, contacta al administrador.');
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundImage}></div>
            <div className={styles.backgroundOverlay}></div>

            <div className={styles.loginCard}>
                <div className={styles.logoSection}>
                    <div className={styles.logoIcon}>
                        <ChefHat size={48} />
                    </div>
                    <h1 className={styles.title}>Info chef 👨🏻‍🍳</h1>
                    <p className={styles.subtitle}>Sistema de Costeo de Recetas</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorAlert}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Correo Electrónico
                        </label>
                        <div className={styles.inputWrapper}>
                            <Mail size={20} className={styles.inputIcon} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setFieldErrors(prev => ({ ...prev, email: false }));
                                    setError('');
                                }}
                                className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.email ? styles.inputError : ''}`}
                                placeholder="usuario@ejemplo.com"
                                required
                                autoComplete="username"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Contraseña
                        </label>
                        <div className={styles.inputWrapper}>
                            <Lock size={20} className={styles.inputIcon} />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setFieldErrors(prev => ({ ...prev, password: false }));
                                    setError('');
                                }}
                                className={`${styles.input} ${styles.inputWithIcon} ${styles.passwordInput} ${fieldErrors.password ? styles.inputError : ''}`}
                                placeholder="Ingresa tu contraseña"
                                required
                                autoComplete="current-password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.optionsRow}>
                        <label className={styles.rememberMe}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={styles.checkbox}
                                disabled={loading}
                            />
                            <span className={styles.checkmark}></span>
                            Recordarme
                        </label>
                        <button
                            type="button"
                            className={styles.forgotPassword}
                            onClick={handleForgotPassword}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className={styles.spinnerIcon} />
                                Iniciando sesión...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>

                {/* Demo Credentials - Only in Development */}
                {isDevelopment && (
                    <div className={styles.demoCredentials}>
                        <button
                            type="button"
                            className={styles.demoToggle}
                            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                            aria-expanded={showDemoCredentials}
                        >
                            <span>Ver credenciales de prueba</span>
                            <ChevronDown
                                size={18}
                                className={`${styles.chevronIcon} ${showDemoCredentials ? styles.chevronOpen : ''}`}
                            />
                        </button>

                        <div className={`${styles.demoContent} ${showDemoCredentials ? styles.demoContentOpen : ''}`}>
                            <p className={styles.demoHint}>Haz clic en un rol para autocompletar:</p>
                            <div className={styles.demoList}>
                                {DEMO_CREDENTIALS.map((cred) => (
                                    <button
                                        key={cred.role}
                                        type="button"
                                        className={styles.demoItem}
                                        onClick={() => {
                                            setEmail(cred.email);
                                            setPassword(cred.password);
                                            setFieldErrors({ email: false, password: false });
                                            setError('');
                                        }}
                                        style={{ '--accent-color': cred.color }}
                                    >
                                        <UserCircle size={20} style={{ color: cred.color }} />
                                        <div className={styles.demoItemInfo}>
                                            <span className={styles.demoRole}>{cred.role}</span>
                                            <span className={styles.demoEmail}>{cred.email}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;


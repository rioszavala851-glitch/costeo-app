import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat, Lock, Mail, AlertCircle } from 'lucide-react';
import styles from './Login.module.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.shape}></div>
                <div className={styles.shape}></div>
                <div className={styles.shape}></div>
            </div>

            <div className={styles.loginCard}>
                <div className={styles.logoSection}>
                    <div className={styles.logoIcon}>
                        <ChefHat size={48} />
                    </div>
                    <h1 className={styles.title}>CosteoApp</h1>
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
                            <Mail size={18} />
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="usuario@ejemplo.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            <Lock size={18} />
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className={styles.spinner}></div>
                                Iniciando sesión...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div className={styles.demoCredentials}>
                    <p className={styles.demoTitle}>Credenciales de prueba:</p>
                    <div className={styles.demoList}>
                        <div className={styles.demoItem}>
                            <strong>Admin:</strong> admin@costeo.com / admin
                        </div>
                        <div className={styles.demoItem}>
                            <strong>Aux. Administrativo:</strong> aux@costeo.com / aux
                        </div>
                        <div className={styles.demoItem}>
                            <strong>Chef:</strong> chef@costeo.com / chef
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

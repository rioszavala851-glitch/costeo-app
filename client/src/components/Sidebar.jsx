import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Cherry,
    ChefHat,
    UtensilsCrossed,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    ChevronDown,
    Tag,
    LogOut,
    User
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar, closeSidebar, isMobile, theme, toggleTheme }) => {
    // ... existing state ...
    const [ingredients, setIngredients] = useState([]);
    const [subRecipes, setSubRecipes] = useState([]);
    const [showIngredients, setShowIngredients] = useState(false);
    const [showSubRecipes, setShowSubRecipes] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        const savedIng = localStorage.getItem('ingredients');
        const savedSub = localStorage.getItem('subRecipes');
        if (savedIng) setIngredients(JSON.parse(savedIng));
        if (savedSub) setSubRecipes(JSON.parse(savedSub));
    }, []);

    const handleNavClick = () => {
        if (isMobile && isOpen) {
            closeSidebar ? closeSidebar() : toggleSidebar();
        }
    };

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
        }
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/ingredients', label: 'Ingredientes', icon: Cherry },
        { path: '/subrecipes', label: 'Sub-recetas', icon: ChefHat },
        { path: '/recipes', label: 'Recetas', icon: UtensilsCrossed },
        { path: '/categories', label: 'Categorías', icon: Tag },
        // Only show Admin tab if user role is 'admin'
        ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Administración', icon: ShieldCheck }] : []),
    ];

    return (
        <div className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
            {/* Header ... */}
            <div className={styles.header}>
                {isOpen && <h2 className={styles.logoText}>CosteoApp</h2>}
                <button onClick={toggleSidebar} className={styles.toggleBtn}>
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                `${styles.link} ${isActive ? styles.active : ''}`
                            }
                            title={!isOpen ? item.label : ''}
                        >
                            <item.icon size={22} className={styles.icon} />
                            <span className={styles.labelText}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {isOpen && (
                    <div className="animate-fade-in" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem 0.5rem' }}>

                        {/* Ingredients Accordion */}
                        <div style={{ marginBottom: '1rem' }}>
                            <button
                                onClick={() => setShowIngredients(!showIngredients)}
                                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Cherry size={16} /> Ref. Ingredientes
                                </span>
                                {showIngredients ? <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> : <ChevronDown size={14} />}
                            </button>

                            {showIngredients && (
                                <div style={{ paddingLeft: '0.5rem', marginTop: '0.5rem' }}>
                                    {ingredients.slice(0, 10).map(ing => (
                                        <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ing.name}</span>
                                            <span style={{ color: 'var(--success)' }}>${Number(ing.price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {ingredients.length > 10 && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>+ {ingredients.length - 10} más...</div>}
                                </div>
                            )}
                        </div>

                        {/* SubRecipes Accordion */}
                        <div>
                            <button
                                onClick={() => setShowSubRecipes(!showSubRecipes)}
                                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ChefHat size={16} /> Ref. Sub-recetas
                                </span>
                                {showSubRecipes ? <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> : <ChevronDown size={14} />}
                            </button>

                            {showSubRecipes && (
                                <div style={{ paddingLeft: '0.5rem', marginTop: '0.5rem' }}>
                                    {subRecipes.slice(0, 10).map(sub => (
                                        <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</span>
                                            <span style={{ color: 'var(--success)' }}>${(sub.cost / (parseFloat(sub.yield) || 1)).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {subRecipes.length > 10 && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>+ {subRecipes.length - 10} más...</div>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Theme Toggle */}
            <div className={styles.footer} style={{ marginTop: 'auto' }}>
                {isOpen && user && (
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            <User size={18} />
                        </div>
                        <div className={styles.userDetails}>
                            <div className={styles.userName}>{user.name}</div>
                            <div className={styles.userRole}>{user.role}</div>
                        </div>
                    </div>
                )}

                <button onClick={toggleTheme} className={styles.themeBtn}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span className={styles.labelText}>
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                    </span>
                </button>

                <button onClick={handleLogout} className={styles.logoutBtn} title={!isOpen ? 'Cerrar Sesión' : ''}>
                    <LogOut size={20} />
                    <span className={styles.labelText}>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

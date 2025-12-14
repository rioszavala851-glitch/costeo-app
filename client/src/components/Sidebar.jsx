import React from 'react';
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
    Tag,
    LogOut,
    User
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';
import PlanBanner from './PlanBanner';

const Sidebar = ({ isOpen, toggleSidebar, closeSidebar, isMobile, theme, toggleTheme }) => {
    const { user, logout } = useAuth();

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
                {isOpen ? (
                    <h2 className={styles.logoText}>CosteoApp</h2>
                ) : (
                    <div className={styles.logoIcon}>
                        <ChefHat size={28} />
                    </div>
                )}
                <button onClick={toggleSidebar} className={styles.toggleBtn} title={isOpen ? 'Colapsar menú' : 'Expandir menú'}>
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

                {/* Plan Status Banner */}
                <PlanBanner isOpen={isOpen} />
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

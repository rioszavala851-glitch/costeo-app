import React, { useState, useEffect } from 'react';
import api from '../../api';
import { User, Trash2, Plus, Pencil, Save, X, Key, Crown } from 'lucide-react';
import styles from '../../pages/Admin.module.css';

const UserManagement = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [userData, setUserData] = useState({ name: '', email: '', password: '', role: 'viewer' });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Password change modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Edit (Password not updated here usually)
                const payload = {
                    name: userData.name,
                    role: userData.role,
                    email: userData.email // Email usually immutable but sending for reference
                };
                const res = await api.put(`/users/${editingId}`, payload);
                setUsers(users.map(u => u._id === editingId ? res.data : u));
                alert('Usuario actualizado correctamente');
            } else {
                // Create
                const res = await api.post('/users', userData);
                setUsers([...users, res.data]);
                alert('Usuario creado exitosamente');
            }
            resetForm();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar usuario. ' + (error.response?.data?.message || ''));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        }
    };

    const handleEdit = (user) => {
        setUserData({
            name: user.name,
            email: user.email,
            password: '', // Password not shown
            role: user.role
        });
        setEditingId(user._id);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setUserData({ name: '', email: '', password: '', role: 'viewer' });
    };

    // Password change handlers
    const handleOpenPasswordModal = (user) => {
        setSelectedUserForPassword(user);
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordModal(true);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 4) {
            alert('La contraseña debe tener al menos 4 caracteres');
            return;
        }

        try {
            await api.put(`/users/${selectedUserForPassword._id}/password`, { newPassword });
            alert('Contraseña cambiada exitosamente');
            setShowPasswordModal(false);
            setSelectedUserForPassword(null);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error al cambiar contraseña: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    // Toggle user plan (free <-> premium)
    const handleTogglePlan = async (user) => {
        const newPlan = user.plan === 'premium' ? 'free' : 'premium';
        const confirmMsg = newPlan === 'premium'
            ? `¿Actualizar a ${user.name} al plan Premium?`
            : `¿Cambiar a ${user.name} al plan Gratuito?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await api.put(`/users/${user._id}/plan`, { plan: newPlan });
            setUsers(users.map(u => u._id === user._id ? { ...u, plan: newPlan } : u));
            alert(res.data.message);
        } catch (error) {
            console.error('Error toggling plan:', error);
            alert('Error al cambiar plan: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    const roleLabels = {
        admin: 'Administración',
        chef: 'Chef',
        viewer: 'Aux. Administrativo'
    };

    const roleStyles = {
        admin: styles.roleAdmin,
        chef: styles.roleUser, // Reusing style for simplicity or create specific
        viewer: styles.roleUser
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Gestión de Usuarios</h3>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className={styles.addBtn}>
                        <Plus size={16} /> Agregar Usuario
                    </button>
                )}
            </div>

            {isAdding && (
                <div className={styles.formContainer}>
                    <div className={styles.cardHeader}>
                        <h4 className={styles.cardTitle}>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
                        <button onClick={resetForm} className={styles.deleteBtn}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSaveUser}>
                        <div className={styles.formGrid}>
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={userData.name}
                                onChange={e => setUserData({ ...userData, name: e.target.value })}
                                required
                                className={styles.input}
                            />
                            <input
                                type="email"
                                placeholder="Correo electrónico"
                                value={userData.email}
                                onChange={e => setUserData({ ...userData, email: e.target.value })}
                                required
                                disabled={!!editingId} // Disable email edit if desired or allow
                                className={styles.input}
                            />
                            {!editingId && (
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={userData.password}
                                    onChange={e => setUserData({ ...userData, password: e.target.value })}
                                    required
                                    className={styles.input}
                                />
                            )}
                            <select
                                value={userData.role}
                                onChange={e => setUserData({ ...userData, role: e.target.value })}
                                className={styles.select}
                            >
                                <option value="admin">Administración</option>
                                <option value="chef">Chef</option>
                                <option value="viewer">Aux. Administrativo</option>
                            </select>
                        </div>
                        <div className={styles.actions}>
                            <button type="button" onClick={resetForm} className={styles.cancelBtn}>
                                Cancelar
                            </button>
                            <button type="submit" className={styles.saveBtn}>
                                <Save size={18} style={{ marginRight: '0.5rem' }} />
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <p>Cargando...</p> : (
                <div className={styles.userList}>
                    {users.map(user => (
                        <div key={user._id} className={styles.userItem}>
                            <div className={styles.userInfo}>
                                <div className={styles.userAvatar}>
                                    <User size={20} color="var(--accent-color)" />
                                </div>
                                <div>
                                    <div className={styles.userName}>
                                        {user.name}
                                        {user.plan === 'premium' && (
                                            <Crown size={14} color="#f59e0b" style={{ marginLeft: '0.5rem' }} />
                                        )}
                                    </div>
                                    <div className={styles.userEmail}>{user.email}</div>
                                    {/* Recipe count indicator */}
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: user.recipePercentage >= 100 ? 'var(--danger)' : user.recipePercentage >= 80 ? 'var(--warning)' : 'var(--text-secondary)',
                                        marginTop: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        📊 Recetas: {user.recipeCount || 0} / {user.recipeLimit === Infinity ? '∞' : user.recipeLimit}
                                        {user.recipePercentage >= 80 && user.plan !== 'premium' && (
                                            <span style={{
                                                background: user.recipePercentage >= 100 ? 'var(--danger)' : 'var(--warning)',
                                                color: 'white',
                                                padding: '0.1rem 0.3rem',
                                                borderRadius: '0.2rem',
                                                fontSize: '0.6rem'
                                            }}>
                                                {user.recipePercentage >= 100 ? 'LÍMITE' : `${user.recipePercentage}%`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.userActions}>
                                {/* Plan Badge */}
                                <span
                                    onClick={() => handleTogglePlan(user)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        background: user.plan === 'premium'
                                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: user.plan === 'premium'
                                            ? '1px solid rgba(245, 158, 11, 0.5)'
                                            : '1px solid var(--glass-border)',
                                        color: user.plan === 'premium' ? '#f59e0b' : 'var(--text-secondary)'
                                    }}
                                    title={`Click para cambiar a ${user.plan === 'premium' ? 'Gratuito' : 'Premium'}`}
                                >
                                    {user.plan === 'premium' ? '★ PREMIUM' : 'GRATIS'}
                                </span>
                                <span className={`${styles.roleBadge} ${roleStyles[user.role] || styles.roleUser}`}>
                                    {roleLabels[user.role] || user.role}
                                </span>
                                <button onClick={() => handleOpenPasswordModal(user)} className={styles.deleteBtn} style={{ color: 'var(--warning)' }} title="Cambiar Contraseña">
                                    <Key size={18} />
                                </button>
                                <button onClick={() => handleEdit(user)} className={styles.deleteBtn} style={{ color: 'var(--accent-color)' }} title="Editar">
                                    <Pencil size={18} />
                                </button>
                                <button onClick={() => handleDelete(user._id)} className={styles.deleteBtn} title="Eliminar">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay usuarios registrados.</p>}
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && selectedUserForPassword && (
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
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius)',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '100%',
                        border: '1px solid var(--accent-color)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
                                <Key size={24} /> Cambiar Contraseña
                            </h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Cambiar contraseña para: <strong style={{ color: 'var(--text-primary)' }}>{selectedUserForPassword.name}</strong>
                        </p>

                        <form onSubmit={handleChangePassword}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    minLength={4}
                                    className={styles.input}
                                    placeholder="Mínimo 4 caracteres"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={4}
                                    className={styles.input}
                                    placeholder="Repetir contraseña"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className={styles.cancelBtn}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={styles.saveBtn}
                                >
                                    <Key size={16} style={{ marginRight: '0.5rem' }} />
                                    Cambiar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

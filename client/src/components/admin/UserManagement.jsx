import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Trash2, Plus, Pencil, Save, X } from 'lucide-react';
import styles from '../../pages/Admin.module.css';

const UserManagement = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [userData, setUserData] = useState({ name: '', email: '', password: '', role: 'viewer' });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
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
                const res = await axios.put(`/api/users/${editingId}`, payload);
                setUsers(users.map(u => u._id === editingId ? res.data : u));
                alert('Usuario actualizado correctamente');
            } else {
                // Create
                const res = await axios.post('/api/users', userData);
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
            await axios.delete(`/api/users/${id}`);
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
                                    <div className={styles.userName}>{user.name}</div>
                                    <div className={styles.userEmail}>{user.email}</div>
                                </div>
                            </div>
                            <div className={styles.userActions}>
                                <span className={`${styles.roleBadge} ${roleStyles[user.role] || styles.roleUser}`}>
                                    {roleLabels[user.role] || user.role}
                                </span>
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
        </div>
    );
};

export default UserManagement;

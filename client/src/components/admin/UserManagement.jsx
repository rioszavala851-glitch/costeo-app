import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Trash2, Plus } from 'lucide-react';

const UserManagement = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'viewer' });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            // In a real app, you'd want validation here
            const res = await axios.post('http://localhost:5000/api/users', newUser);
            setUsers([...users, res.data]);
            setIsAdding(false);
            setNewUser({ name: '', email: '', password: '', role: 'viewer' });
            alert('Usuario creado exitosamente');
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error al crear usuario. Verifica que el servidor esté corriendo.');
        }
    };

    const roleLabels = {
        admin: 'Administración',
        chef: 'Chef',
        viewer: 'Aux. Administrativo'
    };

    return (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Gestión de Usuarios</h3>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn-primary"
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius)', color: 'white' }}
                    >
                        <Plus size={16} /> Agregar Usuario
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleCreateUser} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Nuevo Usuario</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={newUser.name}
                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                            required
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                        />
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            required
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                        />
                        <input
                            type="password"
                            placeholder="Contraseña temporal"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            required
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                        />
                        <select
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                        >
                            <option value="admin">Administración</option>
                            <option value="chef">Chef</option>
                            <option value="viewer">Aux. Administrativo</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="submit" style={{ background: 'var(--success)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold' }}>
                            Guardar Usuario
                        </button>
                    </div>
                </form>
            )}

            {loading ? <p>Cargando...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {users.map(user => (
                        <div key={user._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '50%' }}>
                                    <User size={20} color="var(--accent-color)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', background: user.role === 'admin' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: user.role === 'admin' ? 'var(--success)' : 'var(--accent-color)' }}>
                                    {roleLabels[user.role] || user.role}
                                </span>
                                <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
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

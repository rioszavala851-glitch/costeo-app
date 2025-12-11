import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, X, Save, Pencil } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.map(cat => ({ ...cat, id: cat._id })));
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSaveCategory = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await fetch(`/api/categories/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCategory)
                });
            } else {
                await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCategory)
                });
            }
            fetchCategories();
            setIsAdding(false);
            setEditingId(null);
            setNewCategory({ name: '', description: '' });
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleEdit = (cat) => {
        setNewCategory({ name: cat.name, description: cat.description || '' });
        setEditingId(cat.id);
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta categoría?')) {
            try {
                await fetch(`/api/categories/${id}`, { method: 'DELETE' });
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--accent-color)', padding: '0.75rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                        <Tag size={28} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Categorías</h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestiona las clasificaciones de tus insumos y recetas</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setNewCategory({ name: '', description: '' });
                    }}
                    className="btn-primary"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'var(--accent-color)', color: 'white', border: 'none',
                        padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Nueva Categoría
                </button>
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--accent-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                        <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSaveCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre de Categoría</label>
                            <input
                                required
                                type="text"
                                value={newCategory.name}
                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descripción (Opcional)</label>
                            <input
                                type="text"
                                value={newCategory.description}
                                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="submit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--success)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                <Save size={18} /> Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                {categories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <Tag size={40} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Sin categorías</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Crea categorías para organizar mejor tu inventario.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {categories.map(cat => (
                            <div key={cat.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{cat.name}</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(cat)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }}><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                {cat.description && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{cat.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;

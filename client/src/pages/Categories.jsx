import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Tag, Trash2, X, Save, Pencil } from 'lucide-react';
import styles from './Categories.module.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            const data = res.data;
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
                await api.put(`/categories/${editingId}`, newCategory);
            } else {
                await api.post('/categories', newCategory);
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
        if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
            try {
                await api.delete(`/categories/${id}`);
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className="animate-fade-in">
                <header className={styles.header}>
                    <div className={styles.titleSection}>
                        <div className={styles.iconBox}>
                            <Tag size={28} color="white" />
                        </div>
                        <div>
                            <h1 className={styles.title}>Categorías</h1>
                            <p className={styles.subtitle}>Gestiona las clasificaciones de tus insumos y recetas</p>
                        </div>
                    </div>
                    <button className={styles.addBtn} onClick={() => { setIsAdding(true); setEditingId(null); setNewCategory({ name: '', description: '' }); }}>
                        <Plus size={20} /> Nueva Categoría
                    </button>
                </header>

                {isAdding && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                            <button className={styles.closeBtn} onClick={() => setIsAdding(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form className={styles.form} onSubmit={handleSaveCategory}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre de Categoría</label>
                                <input
                                    required
                                    type="text"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Descripción (Opcional)</label>
                                <input
                                    type="text"
                                    value={newCategory.description}
                                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button type="submit" className={styles.saveBtn}>
                                    <Save size={18} /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <section className={styles.gridContainer}>
                    {categories.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Tag size={40} color="var(--text-secondary)" className={styles.emptyIcon} />
                            <h3 className={styles.emptyTitle}>Sin categorías</h3>
                            <p className={styles.emptyText}>Crea categorías para organizar mejor tu inventario.</p>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {categories.map(cat => (
                                <div key={cat.id} className={styles.cardItem}>
                                    <div className={styles.cardHeader}>
                                        <h4 className={styles.cardTitle}>{cat.name}</h4>
                                        <div className={styles.cardActions}>
                                            <button className={styles.actionBtn} onClick={() => handleEdit(cat)}>
                                                <Pencil size={16} />
                                            </button>
                                            <button className={styles.actionBtn} onClick={() => handleDelete(cat.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {cat.description && <p className={styles.cardDesc}>{cat.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Categories;

import React, { useState } from 'react';

const PermissionsTab = () => {
    const [isEditing, setIsEditing] = useState(false);
    // Initial recommended state
    const [permissions, setPermissions] = useState([
        {
            role: 'Administración',
            superAdmin: 'total',
            recipes: 'total',
            costs: 'total',
            finance: 'total'
        },
        {
            role: 'Chef',
            superAdmin: 'none',
            recipes: 'edit',
            costs: 'view_suggest',
            finance: 'view'
        },
        {
            role: 'Aux. Administrativo',
            superAdmin: 'none',
            recipes: 'view_only',
            costs: 'update',
            finance: 'none'
        }
    ]);

    // Options for each category
    const options = {
        superAdmin: {
            total: { label: '✔ Total', color: 'var(--success)' },
            none: { label: '✘ Sin Acceso', color: 'var(--danger)' }
        },
        recipes: {
            total: { label: '✔ Total', color: 'var(--success)' },
            edit: { label: '✔ Crear/Editar', color: 'var(--success)' },
            view_only: { label: '👁️ Solo Ver', color: 'var(--text-secondary)' },
            none: { label: '✘ Sin Acceso', color: 'var(--danger)' }
        },
        costs: {
            total: { label: '✔ Total', color: 'var(--success)' },
            update: { label: '✔ Actualizar', color: 'var(--success)' },
            view_suggest: { label: '⚠️ Ver/Sugerir', color: 'var(--warning)' },
            none: { label: '✘ Sin Acceso', color: 'var(--danger)' }
        },
        finance: {
            total: { label: '✔ Total', color: 'var(--success)' },
            view: { label: '✔ Ver', color: 'var(--success)' },
            none: { label: '✘ Sin Acceso', color: 'var(--danger)' }
        }
    };

    const handlePermissionChange = (index, field, value) => {
        const newPermissions = [...permissions];
        newPermissions[index][field] = value;
        setPermissions(newPermissions);
    };

    const getLabel = (category, value) => options[category][value]?.label || value;
    const getColor = (category, value) => options[category][value]?.color || 'inherit';

    const handleSave = () => {
        setIsEditing(false);
        // Here you would typically save to backend
        alert("¡Permisos actualizados y guardados correctamente!");
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset Logic could go here if we had a separate initial state
    };

    return (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Matriz de Permisos {isEditing ? '(Editando)' : 'Recomendada'}</h3>
                {!isEditing ? (
                    <button
                        className="btn-secondary"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setIsEditing(true)}
                    >
                        ✏️ Personalizar
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn-secondary"
                            style={{ fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--text-secondary)' }}
                            onClick={handleCancel}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-primary"
                            style={{ fontSize: '0.85rem', background: 'var(--success)', border: 'none' }}
                            onClick={handleSave}
                        >
                            💾 Guardar Cambios
                        </button>
                    </div>
                )}
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Rol</th>
                            <th style={{ textAlign: 'center', padding: '1rem', width: '15%' }}>Super Admin<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>(Usuarios/Config)</span></th>
                            <th style={{ textAlign: 'center', padding: '1rem', width: '15%' }}>Recetas<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>(Cantidades/Técnica)</span></th>
                            <th style={{ textAlign: 'center', padding: '1rem', width: '15%' }}>Costos<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>(Insumos/Precios)</span></th>
                            <th style={{ textAlign: 'center', padding: '1rem', width: '15%' }}>Finanzas<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>(Márgenes/Utilidad)</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissions.map((perm, index) => (
                            <tr key={perm.role} style={{ background: index % 2 === 0 ? 'var(--bg-primary)' : 'transparent' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{perm.role}</td>

                                {/* Super Admin Column */}
                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                    {isEditing ? (
                                        <select
                                            value={perm.superAdmin}
                                            onChange={(e) => handlePermissionChange(index, 'superAdmin', e.target.value)}
                                            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '0.25rem', borderRadius: '4px' }}
                                        >
                                            {Object.entries(options.superAdmin).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ color: getColor('superAdmin', perm.superAdmin) }}>
                                            {getLabel('superAdmin', perm.superAdmin)}
                                        </span>
                                    )}
                                </td>

                                {/* Recipes Column */}
                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                    {isEditing ? (
                                        <select
                                            value={perm.recipes}
                                            onChange={(e) => handlePermissionChange(index, 'recipes', e.target.value)}
                                            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '0.25rem', borderRadius: '4px' }}
                                        >
                                            {Object.entries(options.recipes).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ color: getColor('recipes', perm.recipes) }}>
                                            {getLabel('recipes', perm.recipes)}
                                        </span>
                                    )}
                                </td>

                                {/* Costs Column */}
                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                    {isEditing ? (
                                        <select
                                            value={perm.costs}
                                            onChange={(e) => handlePermissionChange(index, 'costs', e.target.value)}
                                            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '0.25rem', borderRadius: '4px' }}
                                        >
                                            {Object.entries(options.costs).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ color: getColor('costs', perm.costs) }}>
                                            {getLabel('costs', perm.costs)}
                                        </span>
                                    )}
                                </td>

                                {/* Finance Column */}
                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                    {isEditing ? (
                                        <select
                                            value={perm.finance}
                                            onChange={(e) => handlePermissionChange(index, 'finance', e.target.value)}
                                            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '0.25rem', borderRadius: '4px' }}
                                        >
                                            {Object.entries(options.finance).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ color: getColor('finance', perm.finance) }}>
                                            {getLabel('finance', perm.finance)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>💡 Recomendaciones de Seguridad y Flujo</h4>
                <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <li>
                        <strong>Segregación de Responsabilidades:</strong> El <em>Chef</em> debe enfocarse en la técnica (rendimientos y cantidades) y el <em>Aux. Administrativo</em> en la actualización de precios de mercado. Esto evita errores accidentales en las recetas estándar.
                    </li>
                    <li>
                        <strong>Protección de Finanzas:</strong> Se recomienda que el <em>Aux. Administrativo</em> no tenga acceso a los reportes de utilidad global del negocio, solo a la actualización de costos unitarios.
                    </li>
                    <li>
                        <strong>Auditoría de Cambios:</strong> Implementar un sistema de "Logs" para rastrear quién cambió el precio de un ingrediente crítico (Proteínas, Lácteos, etc).
                    </li>
                    <li>
                        <strong>Borrado Restringido:</strong> Solo la cuenta de <em>Administración</em> debería tener permiso para ELIMINAR recetas o ingredientes permanentemente. Los otros roles solo podrían archivarlos o desactivarlos.
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default PermissionsTab;

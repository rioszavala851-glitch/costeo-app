import React, { useState } from 'react';
import UserManagement from '../components/admin/UserManagement';
import PermissionsTab from '../components/admin/PermissionsTab';
import RecipesCloud from '../components/admin/RecipesCloud';
import { Users, Lock, Cloud } from 'lucide-react';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('users');

    const tabs = [
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'permissions', label: 'Permisos', icon: Lock },
        { id: 'cloud', label: 'Nube de Recetas', icon: Cloud },
    ];

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Área Administrativa</h1>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius)',
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--accent-color)' : 'var(--bg-card)',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div>
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'permissions' && <PermissionsTab />}
                {activeTab === 'cloud' && <RecipesCloud />}
            </div>
        </div>
    );
};

export default Admin;

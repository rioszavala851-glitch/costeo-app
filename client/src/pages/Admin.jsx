import React, { useState } from 'react';
import UserManagement from '../components/admin/UserManagement';
import PermissionsTab from '../components/admin/PermissionsTab';
import RecipesCloud from '../components/admin/RecipesCloud';
import { Users, Lock, Cloud, LockKeyhole } from 'lucide-react';
import styles from './Admin.module.css';
import { usePlan } from '../contexts/PlanContext';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('users');
    const { hasFeature } = usePlan();
    const hasCloud = hasFeature('cloudSync');

    const tabs = [
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'permissions', label: 'Permisos', icon: Lock },
        { id: 'cloud', label: 'Nube de Recetas', icon: Cloud, locked: !hasCloud },
    ];

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Área Administrativa</h1>

            {/* Tabs Navigation */}
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {tab.locked && <LockKeyhole size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'permissions' && <PermissionsTab />}
                {activeTab === 'cloud' && <RecipesCloud />}
            </div>
        </div>
    );
};

export default Admin;

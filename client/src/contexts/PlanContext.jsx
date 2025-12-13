import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

export const usePlan = () => {
    const context = useContext(PlanContext);
    if (!context) {
        throw new Error('usePlan must be used within a PlanProvider');
    }
    return context;
};

export const PlanProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [planStatus, setPlanStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPlanStatus = useCallback(async () => {
        if (!token) {
            setPlanStatus(null);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/auth/plan-status');
            setPlanStatus(res.data);
        } catch (error) {
            console.error('Error fetching plan status:', error);
            // Default to free plan on error
            setPlanStatus({
                plan: 'free',
                isPremium: false,
                limits: {
                    recipes: { max: 30, current: 0, remaining: 30, percentage: 0 },
                    devices: { max: 1, current: 1 }
                },
                features: {
                    basicRecipes: true,
                    ingredients: true,
                    subRecipes: true,
                    categories: true,
                    costAnalysis: false,
                    shoppingList: false,
                    exportPDF: false,
                    cloudSync: false,
                    multiDevice: false,
                    advancedReports: false
                }
            });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPlanStatus();
    }, [fetchPlanStatus]);

    // Check if a feature is available
    const hasFeature = (featureName) => {
        if (!planStatus) return false;
        return planStatus.features?.[featureName] ?? false;
    };

    // Check if user can create more recipes
    const canCreateRecipe = () => {
        if (!planStatus) return false;
        if (planStatus.isPremium) return true;
        return planStatus.limits?.recipes?.remaining > 0;
    };

    // Get remaining recipes count
    const getRemainingRecipes = () => {
        if (!planStatus) return 0;
        if (planStatus.isPremium) return Infinity;
        return planStatus.limits?.recipes?.remaining ?? 0;
    };

    const value = {
        planStatus,
        loading,
        isPremium: planStatus?.isPremium ?? false,
        hasFeature,
        canCreateRecipe,
        getRemainingRecipes,
        refreshPlanStatus: fetchPlanStatus
    };

    return (
        <PlanContext.Provider value={value}>
            {children}
        </PlanContext.Provider>
    );
};

export default PlanContext;

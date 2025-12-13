import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlanProvider } from './contexts/PlanContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login';
import './index.css';

import Ingredients from './pages/Ingredients';

// Placeholders for other pages
import SubRecipes from './pages/SubRecipes';

import Recipes from './pages/Recipes';
import Categories from './pages/Categories';

function AppContent() {
  const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 1024px)').matches);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!window.matchMedia('(max-width: 1024px)').matches);
  const [theme, setTheme] = useState('dark');
  const { isAuthenticated } = useAuth();

  // Handle Window Resize via MediaQuery
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');

    const handleChange = (e) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setIsSidebarOpen(false); // Mobile: Default closed
      } else {
        setIsSidebarOpen(true); // Desktop: Default open
      }
    };

    // Sync initial state
    setIsMobile(mediaQuery.matches);

    // Listener
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  // If not authenticated, show only login route
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Overlay for Sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40
          }}
        />
      )}

      <div style={{
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        transform: isMobile && !isSidebarOpen ? 'translateX(-100%)' : 'none',
        transition: 'transform 0.3s ease'
      }}>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          closeSidebar={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </div>

      <main
        style={{
          marginLeft: isMobile ? 0 : (isSidebarOpen ? '1.5px' : '8px'),
          padding: '1.5rem',
          width: '100%',
          transition: 'margin-left 0.3s ease',
          flex: 1
        }}
      >
        {/* Mobile Header with Hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h3 style={{ margin: 0 }}>CosteoApp</h3>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/subrecipes" element={<SubRecipes />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <PlanProvider>
          <AppContent />
        </PlanProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

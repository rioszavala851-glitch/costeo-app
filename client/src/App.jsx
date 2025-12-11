import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import './index.css';

import Ingredients from './pages/Ingredients';

// Placeholders for other pages
import SubRecipes from './pages/SubRecipes';

import Recipes from './pages/Recipes';
import Categories from './pages/Categories';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('dark');

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

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <main
          style={{
            marginLeft: isSidebarOpen ? '260px' : '80px',
            padding: '2rem',
            width: '100%',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route path="/subrecipes" element={<SubRecipes />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import OperatorGrid from './components/OperatorGrid';
import CategoryFilter from './components/CategoryFilter';
import ProjectFilter from './components/ProjectFilter';
import SSHTerminal from './components/SSHTerminal';
import MySQLTerminal from './components/MySQLTerminal';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import { operatorService } from './services/operatorService';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // 在组件初始化时检查 localStorage
    return !!localStorage.getItem('token');
  });

  useEffect(() => {
    // 监听 storage 事件，处理其他标签页的 token 变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setIsAuthenticated(!!e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-hexagon-pattern">
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <div className="container mx-auto px-4 py-8">
                    <ProjectFilter
                      selectedProject={selectedProject}
                      setSelectedProject={setSelectedProject}
                    />
                    <div className="flex flex-col lg:flex-row gap-8">
                      <CategoryFilter
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                      />
                      <OperatorGrid
                        searchTerm={searchTerm}
                        selectedCategory={selectedCategory}
                        selectedProject={selectedProject}
                      />
                    </div>
                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/terminal/:id" 
              element={
                isAuthenticated ? (
                  <SSHTerminal />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/mysql/:id" 
              element={
                isAuthenticated ? (
                  <MySQLTerminal />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CargaDatos from './pages/CargaDatos';
import RecepcionFormularios from './pages/RecepcionFormularios';
import MapaDelito from './pages/MapaDelito';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import './index.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  /**
   * Maneja el cierre de sesión del usuario
   * Restablece el estado de autenticación a false
   */
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Layout recibe la función onLogout como prop para gestionar el cierre de sesión */}
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="recepcion" element={<RecepcionFormularios />} />
          <Route path="carga-datos" element={<CargaDatos />} />
          <Route path="mapa" element={<MapaDelito />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
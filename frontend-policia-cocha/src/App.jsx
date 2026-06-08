import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CargaDatos from './pages/CargaDatos';
import RecepcionFormularios from './pages/RecepcionFormularios';
import MapaDelito from './pages/MapaDelito';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import Validacion from './pages/Validacion';
import './index.css';

// Componente que protege rutas según el rol del usuario
const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user || !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  const [user, setUser] = useState(null); // { token, rol, nombre, ... }

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} user={user} />}>

          {/* Dashboard — Analista y Administrador */}
          <Route
            index
            element={
              <ProtectedRoute user={user} allowedRoles={['analista', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Recepción — todos los roles */}
          <Route
            path="recepcion"
            element={
              <ProtectedRoute user={user} allowedRoles={['operador', 'analista', 'admin']}>
                <RecepcionFormularios />
              </ProtectedRoute>
            }
          />

          {/* Carga de Datos — todos los roles */}
          <Route
            path="carga-datos"
            element={
              <ProtectedRoute user={user} allowedRoles={['operador', 'analista', 'admin']}>
                <CargaDatos />
              </ProtectedRoute>
            }
          />

          {/* Mapa de Calor — Analista y Administrador */}
          <Route
            path="mapa"
            element={
              <ProtectedRoute user={user} allowedRoles={['analista', 'admin']}>
                <MapaDelito />
              </ProtectedRoute>
            }
          />

          {/* Configuración — solo Administrador */}
          <Route
            path="configuracion"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <Configuracion />
              </ProtectedRoute>
            }
          />

          {/* Validacion — Administrador y Analista */}
          <Route
            path="validacion"
            element={
              <ProtectedRoute user={user} allowedRoles={['analista', 'admin']}>
                <Validacion />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* Ruta por defecto: redirige al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};



export default App;
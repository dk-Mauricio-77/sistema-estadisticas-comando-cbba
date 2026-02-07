import React, { useState } from 'react';
import { User, Lock, ShieldAlert } from 'lucide-react';
// Importamos la imagen solo para el fondo
import logoEscudo from '../assets/logo-login.png';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Credenciales "hardcodeadas" para el prototipo
    if (username === 'admin' && password === '1234') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    // Contenedor principal con la imagen de fondo
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${logoEscudo})` }}
    >
      {/* Capa oscura superpuesta para mejorar la lectura (Overlay) */}
      <div className="absolute inset-0 bg-policia-dark/80 backdrop-blur-sm"></div>

      {/* Tarjeta del Formulario (con z-10 para que quede encima de la capa oscura) */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        {/* Encabezado SIN LOGO PEQUEÑO */}
        <div className="bg-gray-50 p-8 text-center border-b">
          {/* Se eliminó la etiqueta <img> que estaba aquí */}
          <h1 className="text-2xl font-extrabold text-policia-green uppercase tracking-tight">Comando Departamental</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Estadística y Planificación</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario Oficial</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full border-gray-300 rounded-lg shadow-sm focus:ring-policia-green focus:border-policia-green p-2.5 border"
                placeholder="Ingrese su credencial"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full border-gray-300 rounded-lg shadow-sm focus:ring-policia-green focus:border-policia-green p-2.5 border"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm animate-pulse">
              <ShieldAlert size={18} /> Credenciales incorrectas. Acceso denegado.
            </div>
          )}

          <button type="submit" className="w-full bg-policia-green hover:bg-[#004d35] text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-95">
            INGRESAR AL SISTEMA
          </button>
        </form>
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
          © 2025 Policía Boliviana - Uso exclusivo autorizado
        </div>
      </div>
    </div>
  );
};

export default Login;
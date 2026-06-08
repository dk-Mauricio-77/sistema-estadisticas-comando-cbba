import React, { useState } from 'react';
import { User, Lock, ShieldAlert } from 'lucide-react';
import logoEscudo from '../assets/logo-login.png';
import { API_BASE } from '../config/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('BOTON PRESIONADO. Datos de login enviados al backend:', username, password);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });

      if (!response.ok) {
        let errorMessage = 'Error en la autenticación';
        try {
          const errorData = await response.json();
          if (errorData && (errorData.message || errorData.error)) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch (_) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Respuesta del backend:', data);

      // Guardar token para que otros módulos puedan usarlo
      localStorage.setItem('token', data.token);

      // Se pasa el objeto completo del usuario al App (incluye token y rol)
      // Asegúrate que tu backend devuelva: { token, rol, nombre, ... }
      setError(false);
      onLogin({
        token: data.token,
        rol: data.user.rol,       // 'Administrador' | 'Analista' | 'Operador'
        nombre: data.user.nombre,
        id: data.user.id,
      });

    } catch (err) {
      console.error('Error durante el login:', err);
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${logoEscudo})` }}
    >
      <div className="absolute inset-0 bg-policia-dark/80 backdrop-blur-sm"></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        <div className="bg-gray-50 p-8 text-center border-b">
          <h1 className="text-2xl font-extrabold text-policia-green uppercase tracking-tight">Comando Departamental</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Estadística y Planificación</p>
        </div>

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

          <button
            type="submit"
            className="w-full bg-policia-green hover:bg-[#004d35] text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-95"
          >
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
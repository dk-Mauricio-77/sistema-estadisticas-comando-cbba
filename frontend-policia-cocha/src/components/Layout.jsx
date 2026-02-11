import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Map, LogOut } from 'lucide-react';
import { HiDocumentText } from 'react-icons/hi';
import logoDashboard from '../assets/logo-dashboard.png';

/**
 * Componente Layout - Estructura principal de la aplicación
 * @param {Function} onLogout - Función callback para manejar el cierre de sesión
 */
const Layout = ({ onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 text-gray-200';
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Barra lateral de navegación */}
      <aside className="w-64 bg-policia-green text-white flex flex-col shadow-xl z-10">
        <div className="p-6 flex flex-col items-center gap-3 border-b border-white/10 text-center">
          <img src={logoDashboard} alt="Logo Cóndor" className="w-20 h-20 drop-shadow-lg filter brightness-110" />
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">POLICÍA BOLIVIANA</h1>
            <p className="text-xs text-white/70">Cmdto. Departamental</p>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-2 mt-4 flex flex-col">
          <Link to="/" className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive('/')}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link to="/recepcion" className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive('/recepcion')}`}>
            <FileText size={20} />
            <span>Recepción de Formularios</span>
          </Link>

          <Link to="/carga-datos" className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive('/carga-datos')}`}>
            <HiDocumentText size={20} />
            <span>Carga de Datos</span>
          </Link>

          <Link to="/mapa" className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive('/mapa')}`}>
            <Map size={20} />
            <span>Mapa de Calor</span>
          </Link>

          {/* Espaciador flexible para posicionar elementos al final del contenedor */}
          <div className="flex-grow"></div>

          <Link to="/configuracion" className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive('/configuracion')}`}>
            <Settings size={20} />
            <span>Configuración</span>
          </Link>

          {/* Botón de cierre de sesión */}
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 p-3 hover:bg-red-600/30 text-red-200 hover:text-white rounded-lg cursor-pointer transition-colors w-full mt-2 border border-transparent hover:border-red-400/30"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </aside>

      {/* Área de contenido principal */}
      <main className="flex-1 overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
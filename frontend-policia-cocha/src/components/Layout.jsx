import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Map, LogOut } from 'lucide-react';
import { HiDocumentText } from 'react-icons/hi';
import logoDashboard from '../assets/logo-dashboard.png';
import { ShieldCheck } from 'lucide-react';


// Definición de todos los items del menú con sus roles permitidos
const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['analista', 'admin'],
  },
  {
    to: '/recepcion',
    label: 'Recepción de Formularios',
    icon: FileText,
    roles: ['operador', 'analista', 'admin'],
  },
  
  {
    to:    '/validacion',
    label: 'Validación',
    icon:  ShieldCheck,
    roles: ['analista', 'admin'],
  },
  {
    to: '/carga-datos',
    label: 'Carga de Datos',
    icon: HiDocumentText,
    roles: ['operador', 'analista', 'admin'],
  },
  {
    to: '/mapa',
    label: 'Mapa de Calor',
    icon: Map,
    roles: ['analista', 'admin'],
  },
];

// Item de configuración separado (va al fondo del sidebar)
const CONFIG_ITEM = {
  to: '/configuracion',
  label: 'Configuración',
  icon: Settings,
  roles: ['admin'],
};

// Etiqueta visual del rol para mostrar en el sidebar
const ROL_BADGE = {
  admin:    { label: 'Administrador', color: 'bg-red-500' },
  analista: { label: 'Analista',      color: 'bg-blue-500' },
  operador: { label: 'Operador',      color: 'bg-yellow-500' },
};

const Layout = ({ onLogout, user }) => {
  const location = useLocation();
  const rol = user?.rol || '';
  const badge = ROL_BADGE[rol] || { label: rol, color: 'bg-gray-500' };

  const isActive = (path) =>
    location.pathname === path
      ? 'bg-white/10 text-white font-bold'
      : 'hover:bg-white/5 text-gray-200';

  // Si el Operador intenta entrar al Dashboard (/), redirigir a /recepcion
  if (rol === 'operador' && location.pathname === '/') {
    return <Navigate to="/recepcion" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Barra lateral */}
      <aside className="w-64 bg-policia-green text-white flex flex-col shadow-xl z-10">

        {/* Logo y título */}
        <div className="p-6 flex flex-col items-center gap-3 border-b border-white/10 text-center">
          <img
            src={logoDashboard}
            alt="Logo Cóndor"
            className="w-20 h-20 drop-shadow-lg filter brightness-110"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">POLICÍA BOLIVIANA</h1>
            <p className="text-xs text-white/70">Cmdto. Departamental</p>
          </div>
        </div>

        {/* Info del usuario logueado */}
        <div className="px-4 py-3 border-b border-white/10 flex flex-col gap-1">
          <p className="text-sm font-semibold text-white truncate">
            {user?.nombre || 'Usuario'}
          </p>
          <span className={`text-xs text-white font-medium px-2 py-0.5 rounded-full w-fit ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Navegación filtrada por rol */}
        <nav className="flex-grow p-4 space-y-2 mt-2 flex flex-col">
          {NAV_ITEMS.filter(item => item.roles.includes(rol)).map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive(to)}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}

          {/* Espaciador */}
          <div className="flex-grow" />

          {/* Configuración — solo Administrador */}
          {CONFIG_ITEM.roles.includes(rol) && (
            <Link
              to={CONFIG_ITEM.to}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive(CONFIG_ITEM.to)}`}
            >
              <Settings size={20} />
              <span>{CONFIG_ITEM.label}</span>
            </Link>
          )}

          {/* Cerrar sesión */}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 p-3 hover:bg-red-600/30 text-red-200 hover:text-white rounded-lg cursor-pointer transition-colors w-full mt-2 border border-transparent hover:border-red-400/30"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
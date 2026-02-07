import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Download, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react';

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol: 'operador',
    unidad: ''
  });

  /**
   * Efecto que se ejecuta al montar el componente
   * Carga la lista de usuarios desde el servidor
   */
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:3001/api/usuarios', formData);
      alert('Usuario creado exitosamente');
      
      // Restablecer estado del formulario a valores iniciales
      setFormData({
        nombre_completo: '',
        email: '',
        password: '',
        rol: 'operador',
        unidad: ''
      });
      
      // Actualizar lista de usuarios desde el servidor
      fetchUsuarios();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Está seguro de desactivar este usuario?')) return;
    
    try {
      await axios.put(`http://localhost:3001/api/usuarios/${id}`, { estado: 'inactivo' });
      alert('Usuario desactivado exitosamente');
      fetchUsuarios();
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      alert('Error al desactivar usuario');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/usuarios/${id}`);
      alert('Usuario eliminado exitosamente');
      fetchUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  const getRolBadgeColor = (rol) => {
    switch (rol) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'analista':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'operador':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'analista':
        return 'Analista';
      case 'operador':
        return 'Operador';
      default:
        return rol;
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Nunca';
    const date = new Date(fecha);
    return date.toLocaleString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con título */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-policia-green">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Administración de usuarios y configuración general</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`py-4 px-2 font-semibold text-sm transition-colors relative ${
              activeTab === 'usuarios'
                ? 'text-policia-green'
                : 'text-gray-600 hover:text-policia-green'
            }`}
          >
            Usuarios
            {activeTab === 'usuarios' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-policia-green rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sistema')}
            className={`py-4 px-2 font-semibold text-sm transition-colors relative ${
              activeTab === 'sistema'
                ? 'text-policia-green'
                : 'text-gray-600 hover:text-policia-green'
            }`}
          >
            Sistema
            {activeTab === 'sistema' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-policia-green rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notificaciones')}
            className={`py-4 px-2 font-semibold text-sm transition-colors relative ${
              activeTab === 'notificaciones'
                ? 'text-policia-green'
                : 'text-gray-600 hover:text-policia-green'
            }`}
          >
            Notificaciones
            {activeTab === 'notificaciones' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-policia-green rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('respaldos')}
            className={`py-4 px-2 font-semibold text-sm transition-colors relative ${
              activeTab === 'respaldos'
                ? 'text-policia-green'
                : 'text-gray-600 hover:text-policia-green'
            }`}
          >
            Respaldos
            {activeTab === 'respaldos' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-policia-green rounded-t-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-8">
        {activeTab === 'usuarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel izquierdo: formulario de creación de usuario */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="text-policia-green" size={24} />
                <h2 className="text-xl font-bold text-gray-800">+ Agregar Usuario</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Crear una nueva cuenta de usuario</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    placeholder="Nombre del usuario"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@policia.gov"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all bg-white"
                  >
                    <option value="operador">Operador</option>
                    <option value="analista">Analista</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unidad *
                  </label>
                  <select
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all bg-white"
                  >
                    <option value="">Seleccionar unidad</option>
                    <option value="Administración">Administración</option>
                    <option value="Estadísticas">Estadísticas</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Tránsito">Tránsito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña temporal
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Contraseña"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-policia-green text-white py-3 rounded-xl font-bold hover:bg-policia-dark transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                >
                  <UserPlus size={20} />
                  + Crear Usuario
                </button>
              </form>
            </div>

            {/* Panel derecho: lista de usuarios del sistema */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Usuarios del Sistema ({usuarios.length})
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold">
                  <Download size={18} />
                  Exportar
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-policia-green"></div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-500">ID: U{String(usuario.id).padStart(3, '0')}</span>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getRolBadgeColor(usuario.rol)}`}>
                              {getRolLabel(usuario.rol)}
                            </span>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                              usuario.estado === 'activo' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-lg">{usuario.nombre_completo}</h3>
                          <p className="text-sm text-gray-600">{usuario.email}</p>
                          {usuario.unidad && (
                            <p className="text-xs text-gray-500 mt-1">{usuario.unidad}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Último acceso: {formatFecha(usuario.ultimo_acceso)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button className="p-2 text-gray-600 hover:text-policia-green hover:bg-green-50 rounded-lg transition-colors">
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDesactivar(usuario.id)}
                          className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <UserX size={16} />
                          Desactivar
                        </button>
                        <button
                          onClick={() => handleEliminar(usuario.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {usuarios.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No hay usuarios registrados</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs de configuración adicionales - Implementación pendiente */}
        {activeTab === 'sistema' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <Shield size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Configuración del Sistema</h2>
            <p className="text-gray-500">Próximamente disponible</p>
          </div>
        )}

        {activeTab === 'notificaciones' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <Shield size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Notificaciones</h2>
            <p className="text-gray-500">Próximamente disponible</p>
          </div>
        )}

        {activeTab === 'respaldos' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <Shield size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Respaldos</h2>
            <p className="text-gray-500">Próximamente disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Configuracion;

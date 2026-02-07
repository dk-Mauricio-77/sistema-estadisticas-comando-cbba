import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Clock, CheckCircle, User, Building2, Calendar } from 'lucide-react';

const RecepcionFormularios = () => {
  const [formData, setFormData] = useState({
    entregado_por: '',
    unidad_policial: '',
    tipo_formulario: '',
    fecha_hora_llegada: '',
    observaciones: ''
  });
  
  const [entregasRecientes, setEntregasRecientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Efecto que se ejecuta al montar el componente
   * Carga las entregas recientes y establece la hora actual en el formulario
   */
  useEffect(() => {
    fetchEntregasRecientes();
    // Inicializar campo de hora con la hora actual del sistema
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    setFormData(prev => ({
      ...prev,
      fecha_hora_llegada: timeString
    }));
  }, []);

  const fetchEntregasRecientes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/recepcion/recientes');
      setEntregasRecientes(response.data);
    } catch (error) {
      console.error('Error al cargar entregas recientes:', error);
      alert('Error al cargar entregas recientes');
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
    
    if (!formData.entregado_por || !formData.unidad_policial || !formData.tipo_formulario) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      
      // Construir timestamp completo combinando fecha actual con hora ingresada por el usuario
      const now = new Date();
      const [hours, minutes] = formData.fecha_hora_llegada.split(':');
      const fechaCompleta = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      const payload = {
        ...formData,
        fecha_hora_llegada: fechaCompleta.toISOString(),
        oficial_receptor_id: null // TODO: Obtener ID del usuario autenticado desde el contexto de autenticación
      };

      await axios.post('http://localhost:3001/api/recepcion', payload);
      
      // Restablecer estado del formulario a valores iniciales
      setFormData({
        entregado_por: '',
        unidad_policial: '',
        tipo_formulario: '',
        fecha_hora_llegada: new Date().toTimeString().slice(0, 5),
        observaciones: ''
      });
      
      // Actualizar lista de entregas recientes desde el servidor
      await fetchEntregasRecientes();
      
      alert('Entrega registrada exitosamente');
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      alert(error.response?.data?.error || 'Error al registrar la entrega');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFechaHora = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHora = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toTimeString().slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Encabezado de la página con banner institucional */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="bg-policia-green p-3 rounded-xl shadow-md">
            <FileText className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-policia-green">Recepción de Formularios</h1>
            <p className="text-gray-600 mt-1">Registro digital de entrega de formularios físicos con acuse automático</p>
          </div>
        </div>
      </div>

      {/* Contenido principal: layout de dos columnas */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: formulario de registro de entrega */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-policia-green" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Registrar Nueva Entrega</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">Complete la información de la entrega del formulario físico</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Entregado por *
                </label>
                <input
                  type="text"
                  name="entregado_por"
                  value={formData.entregado_por}
                  onChange={handleInputChange}
                  placeholder="Nombre del oficial"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unidad *
                </label>
                <select
                  name="unidad_policial"
                  value={formData.unidad_policial}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all bg-white"
                >
                  <option value="">Seleccionar unidad</option>
                  <option value="Comando Departamental">Comando Departamental</option>
                  <option value="Fuerza Especial de Lucha Contra el Crimen">Fuerza Especial de Lucha Contra el Crimen</option>
                  <option value="Tránsito">Tránsito</option>
                  <option value="Policía Comunitaria">Policía Comunitaria</option>
                  <option value="Policía Técnica Judicial">Policía Técnica Judicial</option>
                  <option value="Unidad de Investigación">Unidad de Investigación</option>
                  <option value="Guardia Central">Guardia Central</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Formulario *
                </label>
                <select
                  name="tipo_formulario"
                  value={formData.tipo_formulario}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all bg-white"
                >
                  <option value="">Tipo de formulario</option>
                  <option value="Formulario 03A - Hechos de Tránsito">Formulario 03A - Hechos de Tránsito</option>
                  <option value="Formulario 01 - Denuncia">Formulario 01 - Denuncia</option>
                  <option value="Formulario 02 - Actas">Formulario 02 - Actas</option>
                  <option value="Formulario 04 - Detención">Formulario 04 - Detención</option>
                  <option value="Formulario 05 - Requerimiento">Formulario 05 - Requerimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hora de llegada
                </label>
                <div className="relative">
                  <input
                    type="time"
                    name="fecha_hora_llegada"
                    value={formData.fecha_hora_llegada}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all pr-12"
                  />
                  <Clock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Oficial que recibe
                </label>
                <input
                  type="text"
                  value="Guardia Central"
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  placeholder="Observaciones adicionales (opcional)"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-policia-green text-white py-3 rounded-xl font-bold hover:bg-policia-dark transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Registrar Entrega
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panel derecho: lista de entregas recientes del día actual */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-policia-green" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Entregas Recientes</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">Formularios recibidos hoy</p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-policia-green"></div>
              </div>
            ) : entregasRecientes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay entregas registradas hoy</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {entregasRecientes.map((entrega) => (
                  <div
                    key={entrega.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            {entrega.estado === 'recibido' ? 'Recibido' : entrega.estado}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatHora(entrega.fecha_hora_llegada)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{entrega.tipo_formulario}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span>{entrega.entregado_por}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            <span>{entrega.unidad_policial}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>{formatFechaHora(entrega.fecha_hora_llegada)}</span>
                          </div>
                        </div>
                        {entrega.observaciones && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            "{entrega.observaciones}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecepcionFormularios;

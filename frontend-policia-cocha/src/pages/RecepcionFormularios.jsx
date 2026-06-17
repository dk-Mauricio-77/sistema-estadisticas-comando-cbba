import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Clock, CheckCircle, User, Building2, Calendar } from 'lucide-react';
import { getAllForms } from '../config/formsConfig';
import { API_BASE } from '../config/api';

const UNIDADES = [
  'Comando Departamental',
  'Dirección Dptal. FELCC',
  'Dirección Dptal. FELCV',
  'Dirección Dptal. de Tránsito',
  'Dirección Dptal. DIPROVE',
  'Bomberos Cochabamba',
  'Interpol Cochabamba',
  'Guardia Central',
  'Policía Comunitaria',
  'Unidad de Investigación',
];

const TZ_BOLIVIA = 'America/La_Paz';

/** Hora actual Bolivia (HH:MM) — sin helpers externos */
const horaActualBolivia = () =>
  new Date().toLocaleTimeString('es-BO', {
    timeZone: TZ_BOLIVIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

/** Fecha actual Bolivia (YYYY-MM-DD) */
const fechaHoyBolivia = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ_BOLIVIA }).format(new Date());

/**
 * Extrae HH:MM de un timestamp almacenado sin zona (PostgreSQL timestamp without time zone).
 * Evita new Date() que re-aplica offset y suma 4 horas de más.
 */
const extraerHoraLocal = (valor) => {
  if (!valor) return '—';
  const s = String(valor);
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  const m = s.match(/(?:T|\s)(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  const m2 = s.match(/^(\d{2}):(\d{2})/);
  return m2 ? `${m2[1]}:${m2[2]}` : '—';
};

const formatearHora = (valor) => extraerHoraLocal(valor);

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const s = String(valor);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(valor).toLocaleDateString('es-BO', {
    timeZone: TZ_BOLIVIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Combina fecha+hora Bolivia en string local para PostgreSQL (timestamp without time zone).
 * NO usa toISOString() ni new Date() con offset — la hora ingresada se guarda tal cual.
 */
const combinarFechaHoraBolivia = (horaLocal) => {
  const [hh, mm] = (horaLocal || '00:00').split(':');
  return `${fechaHoyBolivia()} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
};

const RecepcionFormularios = () => {
  const [formData, setFormData] = useState({
    entregado_por:      '',
    unidad_policial:    '',
    tipo_formulario:    '',
    fecha_hora_llegada: '',
    observaciones:      '',
  });

  const [entregasRecientes, setEntregasRecientes] = useState([]);
  const [loading, setLoading]                     = useState(false);
  const [submitting, setSubmitting]               = useState(false);

  const tiposFormulario = getAllForms();

  useEffect(() => {
    fetchEntregasRecientes();
    setFormData(prev => ({ ...prev, fecha_hora_llegada: horaActualBolivia() }));
  }, []);

  const fetchEntregasRecientes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/recepcion/recientes`);
      setEntregasRecientes(response.data);
    } catch (error) {
      console.error('Error al cargar entregas recientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.entregado_por || !formData.unidad_policial || !formData.tipo_formulario) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      const fechaHoraLocal = combinarFechaHoraBolivia(formData.fecha_hora_llegada);

      await axios.post(`${API_BASE}/recepcion`, {
        ...formData,
        fecha_hora_llegada: fechaHoraLocal,
        oficial_receptor_id: null,
      });

      setFormData({
        entregado_por:      '',
        unidad_policial:    '',
        tipo_formulario:    '',
        fecha_hora_llegada: horaActualBolivia(),
        observaciones:      '',
      });

      await fetchEntregasRecientes();
      alert('Entrega registrada exitosamente');
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      alert(error.response?.data?.error || 'Error al registrar la entrega');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
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

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de registro */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-policia-green" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Registrar Nueva Entrega</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">Complete la información de la entrega del formulario físico</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Entregado por *</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad *</label>
                <select
                  name="unidad_policial"
                  value={formData.unidad_policial}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none bg-white"
                >
                  <option value="">Seleccionar unidad</option>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Formulario *</label>
                <select
                  name="tipo_formulario"
                  value={formData.tipo_formulario}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none bg-white"
                >
                  <option value="">Tipo de formulario</option>
                  {tiposFormulario.map(f => (
                    <option key={f.id} value={`${f.codigo} - ${f.nombre}`}>
                      {f.codigo} — {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de llegada</label>
                <div className="relative">
                  <input
                    type="time"
                    name="fecha_hora_llegada"
                    value={formData.fecha_hora_llegada}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none pr-12"
                  />
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Oficial que recibe</label>
                <input
                  type="text"
                  value="Guardia Central"
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  placeholder="Observaciones adicionales (opcional)"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-policia-green text-white py-3 rounded-xl font-bold hover:bg-policia-dark transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting
                  ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Registrando...</span></>
                  : <><CheckCircle size={20} /><span>Registrar Entrega</span></>
                }
              </button>
            </form>
          </div>

          {/* Entregas recientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-policia-green" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Entregas Recientes</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">Formularios recibidos hoy</p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-policia-green" />
              </div>
            ) : entregasRecientes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay entregas registradas hoy</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {entregasRecientes.map(entrega => (
                  <div key={entrega.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        {entrega.estado === 'recibido' ? 'Recibido' : entrega.estado}
                      </span>
                      <span className="text-xs text-gray-500">{formatearHora(entrega.fecha_hora_llegada)}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{entrega.tipo_formulario}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><User size={16} className="text-gray-400" /><span>{entrega.entregado_por}</span></div>
                      <div className="flex items-center gap-2"><Building2 size={16} className="text-gray-400" /><span>{entrega.unidad_policial}</span></div>
                      <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /><span>{formatearFecha(entrega.fecha_hora_llegada)}</span></div>
                    </div>
                    {entrega.observaciones && (
                      <p className="text-xs text-gray-500 mt-2 italic">"{entrega.observaciones}"</p>
                    )}
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
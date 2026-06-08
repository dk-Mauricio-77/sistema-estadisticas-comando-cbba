import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Filter, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

import { API_BASE as API, getAuthHeader } from '../config/api';
import { formatearFechaBolivia, formatearSoloFechaBolivia } from '../utils/fechaBolivia';

const ESTADO_BADGE = {
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800' },
  validado:   { label: 'Validado',   color: 'bg-green-100  text-green-800'  },
  rechazado:  { label: 'Rechazado',  color: 'bg-red-100    text-red-800'    },
  observado:  { label: 'Observado',  color: 'bg-blue-100   text-blue-800'   },
};

const parseDatosEspecificos = (datos) => {
  if (!datos) return {};
  if (typeof datos === 'object' && !Array.isArray(datos)) return datos;
  try { return JSON.parse(datos); } catch { return {}; }
};

const formatearEtiqueta = (clave) =>
  clave.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatearValor = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'object') return JSON.stringify(valor, null, 2);
  return String(valor);
};

// ── Componente: tarjeta de un registro ───────────────────────────────────────
const RegistroCard = ({ registro, onAccion }) => {
  const [expandido, setExpandido]     = useState(false);
  const [motivo, setMotivo]           = useState('');
  const [procesando, setProcesando]   = useState(false);
  const badge = ESTADO_BADGE[registro.estado] || ESTADO_BADGE.pendiente;

  const ejecutarAccion = async (accion) => {
    if (accion === 'rechazar' && !motivo.trim()) {
      alert('Debe ingresar el motivo del rechazo');
      return;
    }
    setProcesando(true);
    await onAccion(registro.id, accion, motivo);
    setProcesando(false);
    setMotivo('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Cabecera de la tarjeta */}
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${badge.color}`}>
            {badge.label}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{registro.nombre_formulario}</p>
            <p className="text-sm text-gray-500">
              {registro.unidad_policial || '—'} · {formatearFechaBolivia(registro.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Zona y casos */}
          {registro.zona && (
            <span className="hidden md:inline text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1">
              Zona: {registro.zona}
            </span>
          )}
          <span className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1">
            {registro.total_casos} caso{registro.total_casos !== 1 ? 's' : ''}
          </span>

          {/* Botones de acción solo si está pendiente */}
          {registro.estado === 'pendiente' && (
            <>
              <button
                onClick={() => ejecutarAccion('validar')}
                disabled={procesando}
                title="Validar"
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                <CheckCircle size={16} /> Validar
              </button>
              <button
                onClick={() => setExpandido(v => !v)}
                title="Rechazar"
                className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-semibold"
              >
                <XCircle size={16} /> Rechazar
              </button>
            </>
          )}

          {/* Ver detalle */}
          <button
            onClick={() => setExpandido(v => !v)}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
            title="Ver detalle"
          >
            {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Panel expandido: detalle + rechazo */}
      {expandido && (
        <div className="border-t border-gray-100 px-6 py-4 space-y-4 bg-gray-50">
          {/* Operador que transcribió */}
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-policia-green">
              Transcrito por:{' '}
              <span className="text-gray-800">
                {registro.operador_nombre || registro.registrado_por || '—'}
              </span>
              {' — '}
              <span className="text-gray-600">
                {registro.operador_unidad || registro.unidad_policial || 'Sin unidad'}
              </span>
            </p>
          </div>

          {/* Metadatos del registro */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Datos del registro</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ['Formulario',     registro.formulario_codigo],
                ['Categoría',      registro.categoria],
                ['Fecha registro', registro.fecha_registro ? formatearSoloFechaBolivia(registro.fecha_registro) : null],
                ['Gestión',        registro.gestion_anio],
                ['Zona',           registro.zona],
                ['Municipio',      registro.municipio],
                ['Departamento',   registro.departamento],
                ['Heridos',        registro.total_heridos],
                ['Muertos',        registro.total_muertos],
                ['GPS',            registro.gps_latitud && registro.gps_longitud ? `${registro.gps_latitud}, ${registro.gps_longitud}` : null],
                ['Registrado',     formatearFechaBolivia(registro.created_at)],
              ].map(([label, val]) => val != null && val !== '' && (
                <div key={label} className="bg-white rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-700 break-words">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* JSONB completo — datos_especificos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Datos transcritos (datos_especificos)
            </p>
            {(() => {
              const datos = parseDatosEspecificos(registro.datos_especificos);
              const entradas = Object.entries(datos);
              if (entradas.length === 0) {
                return (
                  <p className="text-sm text-gray-400 italic bg-white rounded-xl p-4 border border-gray-200">
                    Sin datos específicos registrados
                  </p>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {entradas.map(([clave, valor]) => (
                    <div key={clave} className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 mb-1">{formatearEtiqueta(clave)}</p>
                      <p className="text-sm font-semibold text-gray-700 whitespace-pre-wrap break-words">
                        {formatearValor(valor)}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Motivo de rechazo — solo si está pendiente */}
          {registro.estado === 'pendiente' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Motivo de rechazo</p>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ingrese el motivo del rechazo (requerido para rechazar)"
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none resize-none"
              />
              <button
                onClick={() => ejecutarAccion('rechazar')}
                disabled={procesando || !motivo.trim()}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                <XCircle size={16} />
                {procesando ? 'Procesando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          )}

          {/* Motivo visible si ya fue rechazado */}
          {registro.estado === 'rechazado' && registro.observacion_rechazo && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Motivo del rechazo</p>
              <p className="text-sm text-red-700">{registro.observacion_rechazo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const Validacion = () => {
  const [registros, setRegistros]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [catalogos, setCatalogos]       = useState([]);
  const [stats, setStats]               = useState({ pendiente: 0, validado: 0, rechazado: 0 });

  const cargarRegistros = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroCodigo) params.append('codigo', filtroCodigo);

      const res = await fetch(`${API}/formularios/pendientes?${params}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Error al cargar registros');
      const data = await res.json();
      setRegistros(data);
    } catch (err) {
      console.error('Error al cargar registros:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroCodigo]);

  const cargarStats = async () => {
    try {
      const res = await fetch(`${API}/formularios/stats-validacion`, { headers: getAuthHeader() });
      if (res.ok) setStats(await res.json());
    } catch { /* stats no crítico */ }
  };

  const cargarCatalogo = async () => {
    try {
      const res = await fetch(`${API}/formularios/catalogo`, { headers: getAuthHeader() });
      if (res.ok) setCatalogos(await res.json());
    } catch { /* catalogo no crítico */ }
  };

  useEffect(() => {
    cargarCatalogo();
    cargarStats();
  }, []);

  useEffect(() => { cargarRegistros(); }, [cargarRegistros]);

  const handleAccion = async (id, accion, observacion) => {
    try {
      const res = await fetch(`${API}/formularios/${id}/validar`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ accion, observacion }),
      });

      // Intentar leer el body siempre, independiente del status
      let data = {};
      try { data = await res.json(); } catch { /* respuesta sin body */ }

      if (!res.ok) {
        console.error('Error del servidor:', res.status, data);
        alert(data.message || `Error ${res.status} al procesar la acción`);
        return;
      }

      await cargarRegistros();
      await cargarStats();
    } catch (err) {
      // Aquí llega solo si hay falla de red real (backend caído, CORS, etc.)
      console.error('Error de red al validar:', err.name, err.message);
      alert(`Error de red: ${err.message}. Verifique que el backend esté activo en el puerto 3001.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-policia-green p-3 rounded-xl shadow-md">
              <CheckCircle className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-policia-green">Validación de Datos</h1>
              <p className="text-gray-600 mt-1">Revisión y aprobación de formularios antes de consolidación</p>
            </div>
          </div>
          <button
            onClick={() => { cargarRegistros(); cargarStats(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-600"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
        </div>

        {/* KPIs de validación */}
        <div className="px-8 py-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Pendientes',  key: 'pendiente', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock },
            { label: 'Validados',   key: 'validado',  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  icon: CheckCircle },
            { label: 'Rechazados',  key: 'rechazado', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    icon: XCircle },
          ].map(({ label, key, color, bg, border, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFiltroEstado(key)}
              className={`${bg} border ${border} rounded-2xl p-5 text-left transition-all hover:shadow-md ${filtroEstado === key ? 'ring-2 ring-offset-1 ring-policia-green' : ''}`}
            >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">{label}</p>
              <Icon size={20} className={color} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{stats[key] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="px-8 pb-4 flex items-center gap-4">
        <Filter size={18} className="text-gray-400" />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-policia-green outline-none bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="validado">Validados</option>
          <option value="rechazado">Rechazados</option>
        </select>
        <select
          value={filtroCodigo}
          onChange={e => setFiltroCodigo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-policia-green outline-none bg-white"
        >
          <option value="">Todos los formularios</option>
          {catalogos.map(c => (
            <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Lista de registros */}
      <div className="px-8 pb-8 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-policia-green mx-auto mb-4" />
            <p>Cargando registros...</p>
          </div>
        ) : registros.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <CheckCircle size={56} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-semibold">No hay registros {filtroEstado && `en estado "${ESTADO_BADGE[filtroEstado]?.label}"`}</p>
          </div>
        ) : (
          registros.map(r => (
            <RegistroCard key={r.id} registro={r} onAccion={handleAccion} />
          ))
        )}
      </div>
    </div>
  );
};

export default Validacion;
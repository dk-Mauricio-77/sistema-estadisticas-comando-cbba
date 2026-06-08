import React, { useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';

const CAMPOS_BASE = [
  { id: 'fecha_hecho', tipo: 'date', label: 'Fecha del hecho', requerido: true },
  { id: 'hora_hecho', tipo: 'time', label: 'Hora del hecho', requerido: false },
  { id: 'unidad_transito_registra', tipo: 'text', label: 'Unidad policial', requerido: false },
  { id: 'zona_hecho', tipo: 'text', label: 'Zona del hecho', requerido: false },
  { id: 'municipios', tipo: 'text', label: 'Municipio', requerido: false },
  { id: 'departamento', tipo: 'text', label: 'Departamento', requerido: false },
  { id: 'total_heridos', tipo: 'number', label: 'Total heridos', requerido: false },
  { id: 'total_muertos', tipo: 'number', label: 'Total muertos', requerido: false },
];

/**
 * Formulario genérico de respaldo para tipos sin pantalla dedicada.
 * Persiste campos comunes y pares clave-valor en datos_especificos vía formData plano.
 */
const FormularioGenerico = ({ formData, onChange, titulo, codigo }) => {
  const [nuevaClave, setNuevaClave] = useState('');

  const idsBase = new Set(CAMPOS_BASE.map((c) => c.id));
  const idsReservados = new Set([...idsBase, 'detalle_general', 'observaciones']);

  const camposDinamicos = Object.entries(formData).filter(
    ([k, v]) => !idsReservados.has(k) && !k.endsWith('_lat') && !k.endsWith('_lng') && v !== undefined
  );

  const agregarCampo = () => {
    const clave = nuevaClave.trim().toLowerCase().replace(/\s+/g, '_');
    if (!clave) return;
    if (idsReservados.has(clave) || formData[clave] !== undefined) {
      alert('Esa clave ya existe');
      return;
    }
    onChange(clave, '');
    setNuevaClave('');
  };

  const eliminarCampo = (clave) => {
    onChange(clave, undefined);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <FileText className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-amber-900">Formulario genérico — {codigo || 'Sin código'}</p>
          <p className="text-xs text-amber-800 mt-1">
            {titulo || 'Transcripción rápida'}: complete los datos generales y agregue campos según el formulario físico.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-policia-green mb-6 border-b border-gray-200 pb-3">
          Datos generales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPOS_BASE.map((campo) => (
            <div key={campo.id}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {campo.label}
                {campo.requerido && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={campo.tipo}
                value={formData[campo.id] ?? ''}
                onChange={(e) => onChange(campo.id, e.target.value)}
                required={campo.requerido}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-policia-green mb-4 border-b border-gray-200 pb-3">
          Detalle transcrito
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detalle general</label>
            <textarea
              value={formData.detalle_general ?? ''}
              onChange={(e) => onChange('detalle_general', e.target.value)}
              rows={4}
              placeholder="Descripción general del hecho o contenido principal del formulario"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones ?? ''}
              onChange={(e) => onChange('observaciones', e.target.value)}
              rows={2}
              placeholder="Observaciones adicionales (opcional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-policia-green mb-4 border-b border-gray-200 pb-3">
          Campos adicionales
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={nuevaClave}
            onChange={(e) => setNuevaClave(e.target.value)}
            placeholder="Nombre del campo (ej. placa, victima)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarCampo())}
          />
          <button
            type="button"
            onClick={agregarCampo}
            className="flex items-center gap-1 px-4 py-2 bg-policia-green text-white rounded-xl hover:bg-policia-dark font-semibold text-sm"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>

        {camposDinamicos.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin campos adicionales. Use &quot;Agregar&quot; para transcribir más datos.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {camposDinamicos.map(([clave]) => (
              <div key={clave} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    {clave.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={formData[clave] ?? ''}
                    onChange={(e) => onChange(clave, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => eliminarCampo(clave)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-0.5"
                  title="Eliminar campo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormularioGenerico;

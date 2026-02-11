import React, { useState } from 'react';
import { MapPin, Calendar, Clock, FileText } from 'lucide-react';
import { getFormConfig } from '../config/formsConfig';

/**
 * Componente para renderizar formularios dinámicos basados en configuración
 * @param {Object} props
 * @param {string} props.formId - ID del formulario a renderizar
 * @param {Object} props.formData - Estado del formulario
 * @param {Function} props.onChange - Callback cuando cambia un campo
 * @param {Function} props.onMapSelect - Callback para seleccionar coordenadas en el mapa
 */
const DynamicFormRenderer = ({ formId, formData, onChange, onMapSelect }) => {
  const formConfig = getFormConfig(formId);

  if (!formConfig) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-semibold">Formulario no encontrado: {formId}</p>
      </div>
    );
  }

  /**
   * Maneja el cambio de valor en un campo
   */
  const handleFieldChange = (fieldId, value) => {
    onChange(fieldId, value);
  };

  /**
   * Renderiza un campo individual según su tipo
   */
  const renderField = (campo) => {
    const value = formData[campo.id] || '';
    const fieldKey = `field-${campo.id}`;

    switch (campo.tipo) {
      case 'text':
        return (
          <input
            key={fieldKey}
            type="text"
            id={campo.id}
            value={value}
            onChange={(e) => handleFieldChange(campo.id, e.target.value)}
            placeholder={campo.placeholder || campo.label}
            required={campo.requerido}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all"
          />
        );

      case 'number':
        return (
          <input
            key={fieldKey}
            type="number"
            id={campo.id}
            value={value}
            onChange={(e) => handleFieldChange(campo.id, e.target.value)}
            placeholder={campo.placeholder || campo.label}
            required={campo.requerido}
            min={campo.min}
            max={campo.max}
            step={campo.step || 1}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all"
          />
        );

      case 'select':
        return (
          <select
            key={fieldKey}
            id={campo.id}
            value={value}
            onChange={(e) => handleFieldChange(campo.id, e.target.value)}
            required={campo.requerido}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all bg-white"
          >
            {campo.opciones.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <div key={fieldKey} className="relative">
            <input
              type="date"
              id={campo.id}
              value={value}
              onChange={(e) => handleFieldChange(campo.id, e.target.value)}
              required={campo.requerido}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all pr-12"
            />
            <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        );

      case 'time':
        return (
          <div key={fieldKey} className="relative">
            <input
              type="time"
              id={campo.id}
              value={value}
              onChange={(e) => handleFieldChange(campo.id, e.target.value)}
              required={campo.requerido}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all pr-12"
            />
            <Clock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        );

      case 'textarea':
        return (
          <textarea
            key={fieldKey}
            id={campo.id}
            value={value}
            onChange={(e) => handleFieldChange(campo.id, e.target.value)}
            placeholder={campo.placeholder || campo.label}
            required={campo.requerido}
            rows={campo.rows || 4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none transition-all resize-none"
          />
        );

      case 'map_picker':
        return (
          <div key={fieldKey} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                id={`${campo.id}_display`}
                value={formData[`${campo.id}_lat`] && formData[`${campo.id}_lng`] 
                  ? `${formData[`${campo.id}_lat`]}, ${formData[`${campo.id}_lng`]}`
                  : ''}
                placeholder="Latitud, Longitud"
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => onMapSelect && onMapSelect(campo.id)}
                className="flex items-center gap-2 px-4 py-2 bg-policia-green text-white rounded-xl hover:bg-policia-dark transition-colors font-semibold"
              >
                <MapPin size={20} />
                Seleccionar Coordenadas
              </button>
            </div>
            {campo.descripcion && (
              <p className="text-xs text-gray-500">{campo.descripcion}</p>
            )}
            <input
              type="hidden"
              id={`${campo.id}_lat`}
              value={formData[`${campo.id}_lat`] || ''}
            />
            <input
              type="hidden"
              id={`${campo.id}_lng`}
              value={formData[`${campo.id}_lng`] || ''}
            />
          </div>
        );

      default:
        return (
          <div key={fieldKey} className="text-red-600 text-sm">
            Tipo de campo no soportado: {campo.tipo}
          </div>
        );
    }
  };

  // Si el formulario no tiene secciones configuradas, mostrar mensaje
  if (!formConfig.secciones || formConfig.secciones.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Formulario en Configuración</h2>
        <p className="text-gray-500">
          El formulario <strong>{formConfig.codigo} - {formConfig.nombre}</strong> está registrado en el sistema pero aún no tiene campos configurados.
        </p>
        <p className="text-gray-400 text-sm mt-2">Contacte al administrador para configurar los campos de este formulario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {formConfig.secciones.map((seccion) => (
        <div
          key={seccion.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-policia-green mb-6 border-b border-gray-200 pb-3">
            {seccion.titulo}
          </h3>
          {seccion.campos && seccion.campos.length > 0 ? (
            <div className={`grid grid-cols-1 ${seccion.campos[0]?.gridCols || 'md:grid-cols-2'} gap-4`}>
              {seccion.campos.map((campo) => (
                <div key={campo.id} className={campo.gridCols ? `col-span-full md:col-span-1` : ''}>
                  <label
                    htmlFor={campo.id}
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    {campo.label}
                    {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(campo)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">Esta sección aún no tiene campos configurados.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicFormRenderer;

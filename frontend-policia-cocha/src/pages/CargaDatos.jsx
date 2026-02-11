import React, { useState } from 'react';
import axios from 'axios';
import { Save, FileText, X } from 'lucide-react';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import MapPicker from '../components/MapPicker';
import { getAllForms, getFormConfig } from '../config/formsConfig';

const CargaDatos = () => {
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formData, setFormData] = useState({});
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerFieldId, setMapPickerFieldId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableForms = getAllForms();
  const formConfig = selectedFormId ? getFormConfig(selectedFormId) : null;

  /**
   * Maneja el cambio de formulario seleccionado
   */
  const handleFormSelect = (formId) => {
    setSelectedFormId(formId);
    setFormData({});
  };

  /**
   * Maneja el cambio de valor en cualquier campo del formulario
   */
  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  /**
   * Maneja la apertura del selector de mapa
   */
  const handleMapSelect = (fieldId) => {
    setMapPickerFieldId(fieldId);
    setShowMapPicker(true);
  };

  /**
   * Maneja la selección de coordenadas del mapa
   */
  const handleMapCoordinatesSelect = (lat, lng) => {
    handleFieldChange(`${mapPickerFieldId}_lat`, lat);
    handleFieldChange(`${mapPickerFieldId}_lng`, lng);
    setShowMapPicker(false);
  };

  /**
   * Limpia el formulario
   */
  const handleClear = () => {
    if (window.confirm('¿Está seguro de limpiar el formulario? Se perderán todos los datos ingresados.')) {
      setFormData({});
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFormId) {
      alert('Por favor seleccione un tipo de formulario');
      return;
    }

    // Extraer coordenadas del campo de mapa antes de validar
    let latitud = null;
    let longitud = null;
    
    // Buscar el campo de tipo map_picker en la configuración
    formConfig.secciones.forEach(seccion => {
      seccion.campos.forEach(campo => {
        if (campo.tipo === 'map_picker') {
          const latField = `${campo.id}_lat`;
          const lngField = `${campo.id}_lng`;
          
          // Extraer coordenadas si existen
          if (formData[latField] && formData[lngField]) {
            latitud = parseFloat(formData[latField]);
            longitud = parseFloat(formData[lngField]);
          }
        }
      });
    });

    // Validar campos requeridos (incluyendo coordenadas si el campo de mapa es requerido)
    const requiredFields = [];
    formConfig.secciones.forEach(seccion => {
      seccion.campos.forEach(campo => {
        if (campo.requerido) {
          // Si es un campo de mapa, validar que las coordenadas existan
          if (campo.tipo === 'map_picker') {
            if (!latitud || !longitud || isNaN(latitud) || isNaN(longitud)) {
              requiredFields.push(campo.label);
            }
          } else {
            // Para otros campos, validar normalmente
            if (!formData[campo.id]) {
              requiredFields.push(campo.label);
            }
          }
        }
      });
    });

    if (requiredFields.length > 0) {
      alert(`Por favor complete los siguientes campos requeridos:\n${requiredFields.join('\n')}`);
      return;
    }

    try {
      setSubmitting(true);

      // Preparar datos para enviar al backend
      const fechaHecho = formData.fecha_hecho && formData.hora_hecho
        ? new Date(`${formData.fecha_hecho}T${formData.hora_hecho}`).toISOString()
        : formData.fecha_hecho
        ? new Date(`${formData.fecha_hecho}T00:00:00`).toISOString()
        : new Date().toISOString();

      // Separar campos fijos de campos específicos
      const camposFijos = {
        fecha_hora_hecho: fechaHecho,
        latitud: latitud,
        longitud: longitud,
        tipo_formulario: formConfig.id,
        codigo_caso_principal: formData.n_caso || null,
        unidad_policial: formData.unidad_transito_registra || null,
        usuario_id: null // TODO: Obtener del contexto de autenticación
      };

      // Todos los demás campos van a datos_especificos
      const datosEspecificos = { ...formData };
      
      // Remover campos fijos y campos auxiliares del mapa
      delete datosEspecificos.fecha_hecho;
      delete datosEspecificos.hora_hecho;
      delete datosEspecificos.n_caso;
      delete datosEspecificos.unidad_transito_registra;
      
      // Remover todos los campos auxiliares de map_picker (campos con sufijo _lat y _lng)
      Object.keys(datosEspecificos).forEach(key => {
        if (key.endsWith('_lat') || key.endsWith('_lng')) {
          delete datosEspecificos[key];
        }
      });

      const payload = {
        ...camposFijos,
        datos_especificos: datosEspecificos
      };

      await axios.post('http://localhost:3001/api/incidentes', payload);
      
      alert('Formulario guardado exitosamente y enviado a validación');
      setFormData({});
      setSelectedFormId('');
    } catch (error) {
      console.error('Error al guardar formulario:', error);
      alert(error.response?.data?.error || 'Error al guardar el formulario');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con banner verde claro */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="bg-policia-green p-3 rounded-xl shadow-md">
            <FileText className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-policia-green">Carga y Transcripción de Datos</h1>
            <p className="text-gray-600 mt-1">Sistema de digitalización de formularios policiales con soporte para múltiples tipos de formularios</p>
          </div>
        </div>
      </div>

      {/* Barra de control superior */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Seleccionar Formulario:</label>
            <select
              value={selectedFormId}
              onChange={(e) => handleFormSelect(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-policia-green focus:border-policia-green outline-none bg-white"
            >
              <option value="">Seleccione Tipo de Formulario</option>
              {availableForms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.codigo} - {form.nombre}
                </option>
              ))}
            </select>
          </div>
          {selectedFormId && formConfig && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={18} />
              <span className="font-semibold">{formConfig.nombre}</span>
              <span className="text-gray-400">•</span>
              <span>{formConfig.secciones.reduce((acc, sec) => acc + sec.campos.length, 0)} campos configurados</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-8">
        {!selectedFormId ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Seleccione un Formulario</h2>
            <p className="text-gray-500">Por favor seleccione un tipo de formulario para comenzar</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <DynamicFormRenderer
              formId={selectedFormId}
              formData={formData}
              onChange={handleFieldChange}
              onMapSelect={handleMapSelect}
            />

            {/* Botones de acción fijos en la parte inferior */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 shadow-lg z-10">
              <div className="max-w-7xl mx-auto flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
                >
                  <X size={20} />
                  Limpiar Formulario
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-policia-green text-white rounded-xl hover:bg-policia-dark transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar y Enviar a Validación
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Modal de selector de mapa */}
      {showMapPicker && (
        <MapPicker
          onSelect={handleMapCoordinatesSelect}
          onClose={() => setShowMapPicker(false)}
          initialLat={formData[`${mapPickerFieldId}_lat`]}
          initialLng={formData[`${mapPickerFieldId}_lng`]}
        />
      )}
    </div>
  );
};

export default CargaDatos;

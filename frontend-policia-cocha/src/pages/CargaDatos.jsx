import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Save, FileText, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import MapPicker from '../components/MapPicker';
import { getAllForms, getFormConfig } from '../config/formsConfig';

const CargaDatos = () => {
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formData, setFormData] = useState({});
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerFieldId, setMapPickerFieldId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

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
   * Maneja el clic en el botón de importar Excel
   */
  const handleImportClick = () => {
    if (!selectedFormId) {
      alert('Por favor seleccione un tipo de formulario primero');
      return;
    }
    if (selectedFormId !== 'transito_03a') {
      alert('La importación masiva actualmente solo está disponible para el formulario "Hechos de Tránsito"');
      return;
    }
    fileInputRef.current?.click();
  };

  /**
   * Mapea una fila del Excel al formato esperado por el backend
   */
  const mapearFilaExcel = (fila) => {
    // Función helper para limpiar valores
    const limpiarValor = (valor) => {
      if (valor === null || valor === undefined || valor === '') return null;
      if (typeof valor === 'string') return valor.trim();
      return valor;
    };

    // Función helper para convertir a número
    const aNumero = (valor) => {
      if (!valor) return null;
      const num = parseFloat(valor);
      return isNaN(num) ? null : num;
    };

    // Función helper para generar coordenadas aleatorias alrededor de la Plaza Principal de Cochabamba
    const generarCoordenadasAleatorias = () => {
      // Plaza Principal de Cochabamba: Lat: -17.39, Lng: -66.15
      // Generar variación de +/- 0.01 grados (aproximadamente 1.1 km)
      const variacion = 0.01;
      const latBase = -17.39;
      const lngBase = -66.15;
      
      // Generar coordenadas aleatorias con distribución uniforme
      const lat = latBase + (Math.random() * 2 - 1) * variacion;
      const lng = lngBase + (Math.random() * 2 - 1) * variacion;
      
      return { lat, lng };
    };

    // Función helper para parsear coordenadas (puede venir como "lat, lng" o separadas)
    const parsearCoordenadas = (gpsCombinado, latitud, longitud) => {
      let lat = null;
      let lng = null;

      // Prioridad 1: Campo combinado "GPS LATITUD - LONGITUD"
      if (gpsCombinado) {
        const valor = typeof gpsCombinado === 'string' ? gpsCombinado.trim() : String(gpsCombinado);
        
        // Validar que no esté vacío o sea solo espacios
        if (valor && valor.length > 0 && valor !== 'null' && valor !== 'undefined') {
          // Intentar separar por coma, punto y coma, o espacio
          let partes = [];
          if (valor.includes(',')) {
            partes = valor.split(',').map(p => p.trim());
          } else if (valor.includes(';')) {
            partes = valor.split(';').map(p => p.trim());
          } else if (valor.includes(' ')) {
            partes = valor.split(/\s+/).filter(p => p.trim());
          }
          
          if (partes.length >= 2) {
            lat = aNumero(partes[0]);
            lng = aNumero(partes[1]);
          } else if (partes.length === 1) {
            // Si solo hay un número, intentar parsearlo como latitud
            lat = aNumero(partes[0]);
          }
        }
      }

      // Prioridad 2: Campos separados
      if ((!lat || !lng) && (latitud || longitud)) {
        if (!lat && latitud) lat = aNumero(latitud);
        if (!lng && longitud) lng = aNumero(longitud);
      }

      // Validar que las coordenadas sean válidas y estén en un rango razonable para Bolivia
      const coordenadasValidas = lat !== null && lng !== null && 
                                  !isNaN(lat) && !isNaN(lng) &&
                                  lat >= -23 && lat <= -9 && // Rango de latitud de Bolivia
                                  lng >= -70 && lng <= -57;  // Rango de longitud de Bolivia

      // Si no hay coordenadas válidas, generar coordenadas aleatorias alrededor de la Plaza Principal
      if (!coordenadasValidas) {
        const coordsAleatorias = generarCoordenadasAleatorias();
        lat = coordsAleatorias.lat;
        lng = coordsAleatorias.lng;
      }

      return { lat, lng };
    };

    // Función helper para parsear fecha
    const parsearFecha = (fecha, hora) => {
      if (!fecha && !hora) return new Date().toISOString();
      
      try {
        let date = null;

        // Si es un número de Excel (días desde 1900-01-01)
        // Excel usa el 1 de enero de 1900 como día 1
        if (typeof fecha === 'number') {
          // Excel tiene un bug: cuenta 1900 como año bisiesto aunque no lo fue
          // Fórmula: Excel epoch es 1899-12-30, pero el día 1 es 1900-01-01
          // Entonces: fecha - 1 días desde 1899-12-30
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + (fecha - 1) * 24 * 60 * 60 * 1000);
          
          // Validar que la fecha sea razonable (entre 1900 y 2100)
          if (date.getFullYear() < 1900 || date.getFullYear() > 2100) {
            // Si la fecha no es razonable, intentar otra fórmula
            date = new Date((fecha - 25569) * 86400 * 1000);
          }
        } 
        // Si es un objeto Date (xlsx puede devolverlo con cellDates: true)
        else if (fecha instanceof Date) {
          date = new Date(fecha);
        }
        // Si es string, intentar parsear
        else if (typeof fecha === 'string') {
          const fechaStr = fecha.trim();
          
          if (!fechaStr) {
            date = new Date();
          } else {
            // Intentar diferentes formatos de fecha
            // Formato DD/MM/YYYY o DD-MM-YYYY
            if (fechaStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/)) {
              const partes = fechaStr.split(/[\/\-]/);
              const dia = parseInt(partes[0]);
              const mes = parseInt(partes[1]) - 1; // Mes es 0-indexed
              const anio = parseInt(partes[2].length === 2 ? `20${partes[2]}` : partes[2]);
              date = new Date(anio, mes, dia);
            } else {
              // Intentar parseo directo
              date = new Date(fechaStr);
            }
          }
        }

        // Si no se pudo parsear, usar fecha actual
        if (!date || isNaN(date.getTime())) {
          date = new Date();
        }

        // Agregar hora si está disponible
        if (hora !== null && hora !== undefined && hora !== '') {
          const horaStr = typeof hora === 'string' ? hora.trim() : String(hora);
          
          if (horaStr) {
            // Intentar parsear hora (formato HH:MM o HH:MM:SS)
            const matchHora = horaStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
            if (matchHora) {
              date.setHours(parseInt(matchHora[1]) || 0, parseInt(matchHora[2]) || 0, parseInt(matchHora[3]) || 0);
            } else if (typeof hora === 'number') {
              // Si es un número decimal de Excel (fracción del día)
              // Ejemplo: 0.5 = mediodía (12:00), 0.25 = 6:00 AM
              const horas = Math.floor(hora * 24);
              const minutos = Math.floor((hora * 24 - horas) * 60);
              const segundos = Math.floor(((hora * 24 - horas) * 60 - minutos) * 60);
              date.setHours(horas, minutos, segundos);
            }
          }
        }

        return date.toISOString();
      } catch (e) {
        console.error('Error parseando fecha:', e, { fecha, hora });
        return new Date().toISOString();
      }
    };

    // Mapeo de columnas del Excel a nuestro formato
    // Prioridad: Campo combinado "GPS LATITUD - LONGITUD"
    const coordenadas = parsearCoordenadas(
      fila['GPS LATITUD - LONGITUD'] || fila['GPS LATITUD-LONGITUD'] || fila['GPS_LATITUD_LONGITUD'],
      fila['LATITUD'] || fila['LAT'],
      fila['LONGITUD'] || fila['LNG']
    );

    const fechaHecho = parsearFecha(
      fila['FECHA DEL HECHO'] || fila['FECHA'] || fila['FECHA_HECHO'],
      fila['HORA DEL HECHO'] || fila['HORA'] || fila['HORA_HECHO']
    );

    // Campos fijos para el backend
    const camposFijos = {
      fecha_hora_hecho: fechaHecho,
      latitud: coordenadas.lat,
      longitud: coordenadas.lng,
      tipo_formulario: 'transito_03a',
      codigo_caso_principal: limpiarValor(fila['N° CASO'] || fila['N_CASO'] || fila['CASO']),
      unidad_policial: limpiarValor(fila['UNIDAD DE TRANSITO QUE REGISTRA EL CASO'] || fila['UNIDAD']),
      usuario_id: null
    };

    // Todos los demás campos van a datos_especificos (mapeo completo)
    const datosEspecificos = {};

    // Mapear campos principales del Excel
    const mapeoCampos = {
      'COD. FILTRO': 'cod_filtro',
      'N° CASO': 'n_caso',
      'GESTION': 'gestion',
      'MES DE REGISTRO': 'mes_registro',
      'FECHA DEL HECHO': 'fecha_hecho',
      'HORA DEL HECHO': 'hora_hecho',
      'DEPARTAMENTO': 'departamento',
      'PROVINCIA': 'provincia',
      'MUNICIPIOS': 'municipios',
      'COMUNIDAD / LOCALIDAD': 'comunidad_localidad',
      'ZONA DEL HECHO': 'zona_hecho',
      'AVENIDA/CALLE DEL HECHO': 'avenida_calle',
      'TIPO DE DENUNCIA': 'tipo_denuncia',
      'CLASIFICACION DEL HECHO DE TRANSITO': 'clasificacion_hecho',
      'SUB CLASIFICACION DE HECHOS DE TRANSITO': 'sub_clasificacion_hechos',
      'CAUSAS': 'causas',
      'ESTADO DE LA VIA': 'estado_via',
      'TOTAL HERIDOS': 'total_heridos',
      'TOTAL MUERTOS': 'total_muertos',
      'NOMBRE DEL CONDUCTOR PROTAGONISTA': 'nombre_conductor_protagonista',
      'SEXO': 'sexo',
      'EDAD': 'edad',
      'PLACA': 'placa',
      'SOAT': 'soat',
      'BREVE DETALLE DEL HECHO': 'breve_detalle_hecho'
    };

    // Mapear campos conocidos
    Object.keys(mapeoCampos).forEach(excelKey => {
      if (fila[excelKey] !== undefined && fila[excelKey] !== null && fila[excelKey] !== '') {
        const valor = limpiarValor(fila[excelKey]);
        if (valor !== null) {
          datosEspecificos[mapeoCampos[excelKey]] = valor;
        }
      }
    });

    // Copiar todos los demás campos del Excel que no estén mapeados
    Object.keys(fila).forEach(key => {
      if (!mapeoCampos[key] && fila[key] !== undefined && fila[key] !== null && fila[key] !== '') {
        // Convertir nombre de columna a snake_case
        const campoId = key.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .replace(/_+/g, '_');
        
        if (campoId && !datosEspecificos[campoId]) {
          datosEspecificos[campoId] = limpiarValor(fila[key]);
        }
      }
    });

    return {
      ...camposFijos,
      datos_especificos: datosEspecificos
    };
  };

  /**
   * Maneja la carga y procesamiento del archivo Excel
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensión
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      setImporting(true);
      setImportProgress({ current: 0, total: 0 });

      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false });
      
      // Selección inteligente de hoja
      // Prioridad 1: Buscar hoja que contenga "HECHOS" o "TRANSITO" en el nombre
      let selectedSheetName = null;
      let selectedSheet = null;
      
      for (const sheetName of workbook.SheetNames) {
        const upperName = sheetName.toUpperCase();
        if (upperName.includes('HECHOS') || upperName.includes('TRANSITO') || upperName.includes('TRÁNSITO')) {
          selectedSheetName = sheetName;
          selectedSheet = workbook.Sheets[sheetName];
          console.log(`Hoja seleccionada por nombre: ${sheetName}`);
          break;
        }
      }
      
      // Prioridad 2: Si no se encontró, buscar la hoja con más de 20 filas
      if (!selectedSheet) {
        let maxRows = 0;
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
          const rowCount = range.e.r - range.s.r + 1;
          
          if (rowCount > maxRows && rowCount > 20) {
            maxRows = rowCount;
            selectedSheetName = sheetName;
            selectedSheet = sheet;
          }
        }
        
        if (selectedSheet) {
          console.log(`Hoja seleccionada por tamaño (${maxRows} filas): ${selectedSheetName}`);
        }
      }
      
      // Prioridad 3: Si aún no hay hoja, usar la primera
      if (!selectedSheet) {
        selectedSheetName = workbook.SheetNames[0];
        selectedSheet = workbook.Sheets[selectedSheetName];
        console.log(`Usando primera hoja por defecto: ${selectedSheetName}`);
      }
      
      // Usar siempre la fila 5 (índice 4) como inicio de encabezados
      const headerRowIndex = 4;
      console.log(`Leyendo datos desde fila ${headerRowIndex + 1} (índice ${headerRowIndex})`);
      
      // Convertir a JSON empezando desde la fila 5 (índice 4)
      const jsonData = XLSX.utils.sheet_to_json(selectedSheet, { 
        range: headerRowIndex,
        defval: null,
        raw: true, // Mantener números y fechas como están para mejor control
        dateNF: 'yyyy-mm-dd' // Formato de fecha
      });

      if (jsonData.length === 0) {
        alert('El archivo Excel está vacío o no contiene datos después de los encabezados');
        setImporting(false);
        return;
      }

      console.log(`Archivo Excel leído. Encabezados en fila ${headerRowIndex + 1}, registros encontrados: ${jsonData.length}`);

      // Procesar y enviar cada fila
      let exitosos = 0;
      let errores = 0;
      const erroresDetalle = [];

      setImportProgress({ current: 0, total: jsonData.length });

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const fila = jsonData[i];
          const payload = mapearFilaExcel(fila);

          // Validar que tenga fecha (requerido)
          if (!payload.fecha_hora_hecho) {
            errores++;
            erroresDetalle.push(`Fila ${i + 2}: Falta fecha del hecho`);
            continue;
          }

          await axios.post('http://localhost:3001/api/incidentes', payload);
          exitosos++;
          
          setImportProgress({ current: i + 1, total: jsonData.length });
        } catch (error) {
          errores++;
          const mensajeError = error.response?.data?.error || error.message || 'Error desconocido';
          erroresDetalle.push(`Fila ${i + 2}: ${mensajeError}`);
          console.error(`Error en fila ${i + 2}:`, error);
        }

        // Pequeña pausa para no saturar el servidor
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Mostrar resultado
      const mensaje = `Importación completada:\n\n✅ Exitosos: ${exitosos}\n❌ Errores: ${errores}`;
      
      if (errores > 0 && erroresDetalle.length > 0) {
        console.warn('Errores durante la importación:', erroresDetalle);
        alert(`${mensaje}\n\nRevisa la consola para ver los detalles de los errores.`);
      } else {
        alert(mensaje);
      }

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error);
      alert(`Error al procesar el archivo: ${error.message}`);
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
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
          <div className="flex items-center gap-4">
            {selectedFormId && formConfig && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText size={18} />
                <span className="font-semibold">{formConfig.nombre}</span>
                <span className="text-gray-400">•</span>
                <span>{formConfig.secciones.reduce((acc, sec) => acc + sec.campos.length, 0)} campos configurados</span>
              </div>
            )}
            {selectedFormId === 'transito_03a' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleImportClick}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={18} />
                  {importing ? 'Importando...' : 'Importar Excel'}
                </button>
              </>
            )}
          </div>
        </div>
        {importing && importProgress.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Procesando registros...</span>
              <span>{importProgress.current} / {importProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-policia-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
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

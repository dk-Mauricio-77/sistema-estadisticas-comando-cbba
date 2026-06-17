import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Save, FileText, X, Upload, AlertCircle, Edit, RefreshCw, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import FormularioGenerico from '../components/FormularioGenerico';
import MapPicker from '../components/MapPicker';
import { getAllForms, getFormConfig } from '../config/formsConfig';
import { API_BASE, getAuthHeader } from '../config/api';

const TZ_BOLIVIA = 'America/La_Paz';

const fechaHoyBolivia = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ_BOLIVIA }).format(new Date());

const formatearFechaBolivia = (iso) => {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(iso).toLocaleDateString('es-BO', {
    timeZone: TZ_BOLIVIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const FORM_ID_TO_CODIGO = {
  transito_03a: '03A',
  transito_03b: '03B',
  felcv_fem:    'FELCV-FEM',
  felcv_vf:     'FELCV-VF',
  felcv_vio:    'FELCV-VIO',
  felcc_rob:    'FELCC-ROB',
  felcc_hur:    'FELCC-HUR',
  felcc_rag:    'FELCC-RAG',
  diprove_v:    'DIPROVE-V',
  diprove_m:    'DIPROVE-M',
  bomb_inc:     'BOMB-INC',
  falt_alc:     'FALT-ALC',
  falt_rin:     'FALT-RIN',
  conf_soc:     'CONF-SOC',
};

const CODIGO_03A = '03A';

const esFormulario03A = (formId, codigo) =>
  formId === 'transito_03a' || codigo === CODIGO_03A;

const CODIGO_TO_FORM_ID = Object.fromEntries(
  Object.entries(FORM_ID_TO_CODIGO).map(([formId, codigo]) => [codigo, formId]),
);

/**
 * Campos que tienen columna propia en registros_formularios.
 * Todo lo que NO esté aquí va a datos_especificos (JSONB).
 */
const CAMPOS_COLUMNA_PROPIA = new Set([
  'fecha_hecho',
  'hora_hecho',
  'unidad_transito_registra',
  'zona_hecho',
  'municipios',
  'departamento',
  'total_heridos',
  'total_muertos',
]);

const resolverCodigoFormulario = (formId, catalogo = []) => {
  if (FORM_ID_TO_CODIGO[formId]) return FORM_ID_TO_CODIGO[formId];

  const config = getFormConfig(formId);
  if (!config) return formId.toUpperCase();

  const codigoLimpio = config.codigo.replace(/^FORM\.\s*/i, '').trim();

  const match = catalogo.find(c =>
    c.codigo === codigoLimpio
    || c.codigo.toUpperCase().startsWith(codigoLimpio.toUpperCase())
    || codigoLimpio.toUpperCase().startsWith(c.codigo.toUpperCase())
    || c.nombre.toLowerCase().includes(config.nombre.toLowerCase())
    || config.nombre.toLowerCase().includes(c.nombre.toLowerCase()),
  );

  return match?.codigo || codigoLimpio;
};

const CargaDatos = () => {
  const [activeTab, setActiveTab]           = useState('nuevo');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formData, setFormData]             = useState({});
  const [correctingId, setCorrectingId]     = useState(null);
  const [showMapPicker, setShowMapPicker]   = useState(false);
  const [mapPickerFieldId, setMapPickerFieldId] = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState(null);
  const [importing, setImporting]           = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [observados, setObservados]         = useState([]);
  const [loadingObservados, setLoadingObservados] = useState(false);
  const [errorObservados, setErrorObservados]     = useState(null);
  const [catalogoFormularios, setCatalogoFormularios] = useState([]);
  const fileInputRef = useRef(null);

  const availableForms = getAllForms();
  const formConfig     = selectedFormId ? getFormConfig(selectedFormId) : null;

  const codigoActivo = selectedFormId
    ? resolverCodigoFormulario(selectedFormId, catalogoFormularios)
    : '';

  const usaFormularioGenerico = selectedFormId && !esFormulario03A(selectedFormId, codigoActivo);

  const resolverFormId = useCallback((formularioCodigo) => {
    if (formularioCodigo === CODIGO_03A) return 'transito_03a';
    if (CODIGO_TO_FORM_ID[formularioCodigo]) return CODIGO_TO_FORM_ID[formularioCodigo];
    const match = availableForms.find(
      f => FORM_ID_TO_CODIGO[f.id] === formularioCodigo
        || f.codigo?.toUpperCase().includes(formularioCodigo),
    );
    return match?.id || availableForms.find(f => f.id !== 'transito_03a')?.id || '';
  }, [availableForms]);

  useEffect(() => {
    axios.get(`${API_BASE}/formularios/catalogo`, { headers: getAuthHeader() })
      .then(res => setCatalogoFormularios(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCatalogoFormularios([]));
  }, []);

  const cargarObservados = useCallback(async () => {
    setLoadingObservados(true);
    setErrorObservados(null);
    try {
      const res = await axios.get(
        `${API_BASE}/formularios/mis-registros?estado=rechazado`,
        { headers: getAuthHeader() },
      );
      setObservados(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al cargar observados';
      setErrorObservados(msg);
      setObservados([]);
    } finally {
      setLoadingObservados(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'observados') cargarObservados();
  }, [activeTab, cargarObservados]);

  useEffect(() => {
    cargarObservados();
  }, [cargarObservados]);

  const hidratarDesdeRegistro = (registro) => {
    const formId = resolverFormId(registro.formulario_codigo);
    if (!formId) {
      alert(`No se encontró configuración para el formulario "${registro.formulario_codigo}"`);
      return false;
    }

    let datos = registro.datos_especificos || {};
    if (typeof datos === 'string') {
      try { datos = JSON.parse(datos); } catch { datos = {}; }
    }

    const nuevoFormData = { ...datos };
    const es03A = esFormulario03A(formId, registro.formulario_codigo);

    if (registro.unidad_policial) nuevoFormData.unidad_transito_registra = registro.unidad_policial;
    if (registro.zona)            nuevoFormData.zona_hecho  = registro.zona;
    if (registro.municipio)       nuevoFormData.municipios  = registro.municipio;
    if (registro.departamento)    nuevoFormData.departamento = registro.departamento;
    if (registro.fecha_registro) {
      const fr = registro.fecha_registro;
      nuevoFormData.fecha_hecho = typeof fr === 'string' ? fr.split('T')[0] : fr;
    }
    if (registro.total_heridos != null) nuevoFormData.total_heridos = registro.total_heridos;
    if (registro.total_muertos != null) nuevoFormData.total_muertos = registro.total_muertos;

    if (es03A) {
      const config = getFormConfig(formId);
      config?.secciones?.forEach(sec => sec.campos?.forEach(campo => {
        if (campo.tipo === 'map_picker' && registro.gps_latitud != null && registro.gps_longitud != null) {
          nuevoFormData[`${campo.id}_lat`] = registro.gps_latitud;
          nuevoFormData[`${campo.id}_lng`] = registro.gps_longitud;
        }
      }));
    }

    setSelectedFormId(formId);
    setFormData(nuevoFormData);
    setCorrectingId(registro.id);
    setSubmitError(null);
    setActiveTab('nuevo');
    return true;
  };

  const handleCorregir = (registro) => {
    hidratarDesdeRegistro(registro);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarCorreccion = () => {
    if (correctingId && !window.confirm('¿Cancelar la corrección en curso?')) return;
    setCorrectingId(null);
    setFormData({});
    setSelectedFormId('');
    setSubmitError(null);
  };

  const handleFormSelect = (formId) => {
    if (correctingId && formId !== selectedFormId) {
      if (!window.confirm('Cambiar de formulario cancelará la corrección en curso. ¿Continuar?')) return;
      setCorrectingId(null);
    }
    setSelectedFormId(formId);
    setFormData({});
    setSubmitError(null);
  };

  /**
   * Construye el payload para POST/PATCH.
   * 03A: empaqueta TODOS los campos en datos_especificos (excepto _lat/_lng del mapa).
   * Otros formularios: excluye solo los que tienen columna propia en la tabla.
   */
  const construirPayload = (gps_latitud, gps_longitud) => {
    const formulario_codigo = resolverCodigoFormulario(selectedFormId, catalogoFormularios);
    const nombre_formulario = formConfig?.nombre || null;
    const es03A = esFormulario03A(selectedFormId, formulario_codigo);
    const fechaStr  = formData.fecha_hecho || fechaHoyBolivia();
    const partes    = fechaStr.split('-');
    const gestion   = parseInt(partes[0], 10) || new Date().getFullYear();
    const mes       = parseInt(partes[1], 10) || (new Date().getMonth() + 1);

    const datos_especificos = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (k.endsWith('_lat') || k.endsWith('_lng')) return;
      if (!es03A && CAMPOS_COLUMNA_PROPIA.has(k)) return;
      datos_especificos[k] = v;
    });

    return {
      formulario_codigo,
      nombre_formulario,
      unidad_policial:  formData.unidad_transito_registra || null,
      fecha_registro:   fechaStr,
      gestion_anio:     gestion,
      mes_registro:     mes,
      gps_latitud,
      gps_longitud,
      zona:             formData.zona_hecho   || null,
      municipio:        formData.municipios   || 'Cochabamba',
      departamento:     formData.departamento || 'Cochabamba',
      total_heridos:    parseInt(formData.total_heridos, 10) || 0,
      total_muertos:    parseInt(formData.total_muertos, 10) || 0,
      datos_especificos,
    };
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => {
      if (value === undefined) {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      }
      return { ...prev, [fieldId]: value };
    });
  };

  const handleMapSelect = (fieldId) => {
    setMapPickerFieldId(fieldId);
    setShowMapPicker(true);
  };

  const handleMapCoordinatesSelect = (lat, lng) => {
    handleFieldChange(`${mapPickerFieldId}_lat`, lat);
    handleFieldChange(`${mapPickerFieldId}_lng`, lng);
    setShowMapPicker(false);
  };

  const handleClear = () => {
    if (window.confirm('¿Está seguro de limpiar el formulario? Se perderán todos los datos ingresados.')) {
      setFormData({});
      setCorrectingId(null);
      setSubmitError(null);
    }
  };

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

  const mapearFilaExcel = (fila) => {
    const limpiar  = v => (v === null || v === undefined || v === '') ? null : (typeof v === 'string' ? v.trim() : v);
    const aNumero  = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

    const normalizarClave = (k) =>
      String(k || '').trim().toUpperCase().replace(/\s+/g, ' ');

    const filaNorm = {};
    Object.entries(fila).forEach(([k, v]) => {
      filaNorm[normalizarClave(k)] = v;
    });
    const get = (...keys) => {
      for (const k of keys) {
        const v = limpiar(filaNorm[normalizarClave(k)]);
        if (v !== null) return v;
      }
      return null;
    };

    const generarCoordsAleatorias = () => ({
      lat: -17.39 + (Math.random() * 2 - 1) * 0.01,
      lng: -66.15 + (Math.random() * 2 - 1) * 0.01,
    });

    const parsearCoordenadas = (gps, lat, lng) => {
      let la = null, lo = null;
      if (gps) {
        const v   = String(gps).trim();
        const sep = v.includes(',') ? ',' : v.includes(';') ? ';' : ' ';
        const p   = v.split(sep).map(x => x.trim());
        if (p.length >= 2) { la = aNumero(p[0]); lo = aNumero(p[1]); }
      }
      if (!la && lat) la = aNumero(lat);
      if (!lo && lng) lo = aNumero(lng);
      const valido = la && lo && la >= -23 && la <= -9 && lo >= -70 && lo <= -57;
      return valido ? { lat: la, lng: lo } : generarCoordsAleatorias();
    };

    const parsearHoraTexto = (hora) => {
      if (hora === null || hora === undefined || hora === '') return null;
      if (typeof hora === 'number') {
        const h = Math.floor(hora * 24);
        const m = Math.floor((hora * 24 - h) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
      const s = String(hora).trim();
      const m = s.match(/(\d{1,2}):(\d{2})/);
      return m ? `${String(m[1]).padStart(2, '0')}:${m[2]}` : s;
    };

    const parsearFechaTexto = (fecha) => {
      if (fecha === null || fecha === undefined || fecha === '') return fechaHoyBolivia();
      if (typeof fecha === 'number') {
        const d = new Date((fecha - 25569) * 86400 * 1000);
        return d.toLocaleDateString('en-CA', { timeZone: TZ_BOLIVIA });
      }
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('en-CA', { timeZone: TZ_BOLIVIA });
      }
      const s = String(fecha).trim();
      const p = s.split(/[\/\-]/);
      if (p.length === 3) {
        if (p[0].length === 4) return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
        return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
      }
      const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : fechaHoyBolivia();
    };

    const coords = parsearCoordenadas(
      get('GPS LATITUD - LONGITUD', 'GPS LATITUD-LONGITUD', 'GPS'),
      get('LATITUD'),
      get('LONGITUD'),
    );

    const fechaStr = parsearFechaTexto(get('FECHA DEL HECHO', 'FECHA'));
    const horaStr  = parsearHoraTexto(get('HORA DEL HECHO', 'HORA'));
    const partes   = fechaStr.split('-');
    const gestion  = parseInt(partes[0], 10);
    const mes      = parseInt(partes[1], 10);

    const mapeoCampos = {
      'COD. FILTRO': 'cod_filtro', 'N° CASO': 'n_caso', 'N CASO': 'n_caso',
      'GESTION': 'gestion', 'MES DE REGISTRO': 'mes_registro',
      'DEPARTAMENTO': 'departamento', 'PROVINCIA': 'provincia',
      'MUNICIPIOS': 'municipios', 'COMUNIDAD / LOCALIDAD': 'comunidad_localidad',
      'ZONA DEL HECHO': 'zona_hecho', 'AVENIDA/CALLE DEL HECHO': 'avenida_calle',
      'AVENIDA/CALLE': 'avenida_calle',
      'TIPO DE DENUNCIA': 'tipo_denuncia',
      'CLASIFICACION DEL HECHO DE TRANSITO': 'clasificacion_hecho',
      'SUB CLASIFICACION DE HECHOS DE TRANSITO': 'sub_clasificacion_hechos',
      'CAUSAS': 'causas', 'ESTADO DE LA VIA': 'estado_via',
      'TOTAL HERIDOS': 'total_heridos', 'TOTAL MUERTOS': 'total_muertos',
      'NOMBRE DEL CONDUCTOR PROTAGONISTA': 'nombre_conductor',
      'SEXO': 'sexo', 'EDAD': 'edad', 'PLACA': 'placa', 'SOAT': 'soat',
      'BREVE DETALLE DEL HECHO': 'breve_detalle',
      'UNIDAD DE TRANSITO QUE REGISTRA EL CASO': 'unidad_transito_registra',
      'TRAMO CARRETERO': 'tramo_carretero',
      'CATEGORIZACION DE CARRETERAS': 'categorizacion_carreteras',
      'AREA (RURAL O URBANO)': 'area',
    };

    const datos_especificos = {};
    if (fechaStr) datos_especificos.fecha_hecho = fechaStr;
    if (horaStr)  datos_especificos.hora_hecho  = horaStr;

    Object.entries(mapeoCampos).forEach(([excelKey, campoId]) => {
      const v = get(excelKey);
      if (v !== null) datos_especificos[campoId] = v;
    });

    Object.entries(filaNorm).forEach(([keyNorm, rawVal]) => {
      const yaMapeado = Object.keys(mapeoCampos).some(ek => normalizarClave(ek) === keyNorm);
      if (yaMapeado) return;
      const v = limpiar(rawVal);
      if (v === null) return;
      const id = keyNorm.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      if (id && !datos_especificos[id]) datos_especificos[id] = v;
    });

    return {
      formulario_codigo: '03A',
      unidad_policial:   get('UNIDAD DE TRANSITO QUE REGISTRA EL CASO', 'UNIDAD') || datos_especificos.unidad_transito_registra,
      fecha_registro:    fechaStr,
      gestion_anio:      gestion,
      mes_registro:      mes,
      gps_latitud:       coords.lat,
      gps_longitud:      coords.lng,
      zona:              get('ZONA DEL HECHO') || datos_especificos.zona_hecho || null,
      municipio:         get('MUNICIPIOS') || datos_especificos.municipios || 'Cochabamba',
      departamento:      get('DEPARTAMENTO') || datos_especificos.departamento || 'Cochabamba',
      total_heridos:     aNumero(get('TOTAL HERIDOS')) || 0,
      total_muertos:     aNumero(get('TOTAL MUERTOS')) || 0,
      datos_especificos,
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      setImporting(true);
      setImportProgress({ current: 0, total: 0 });

      const data = await file.arrayBuffer();
      const wb   = XLSX.read(data, { type: 'array', cellDates: true });

      let sheetName = wb.SheetNames.find(n => /HECHOS|TRANSITO|TRÁNSITO/i.test(n));
      if (!sheetName) {
        sheetName = wb.SheetNames.reduce((best, n) => {
          const r    = XLSX.utils.decode_range(wb.Sheets[n]['!ref'] || 'A1');
          const rows = r.e.r - r.s.r + 1;
          return rows > (best.rows || 0) ? { name: n, rows } : best;
        }, {}).name || wb.SheetNames[0];
      }

      const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        range: 4, defval: null, raw: true,
      });

      if (!jsonData.length) {
        alert('El archivo Excel está vacío o no contiene datos');
        return;
      }

      let exitosos = 0, errores = 0;
      const erroresDetalle = [];
      setImportProgress({ current: 0, total: jsonData.length });

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const payload = mapearFilaExcel(jsonData[i]);
          await axios.post(`${API_BASE}/formularios/registrar`, payload, { headers: getAuthHeader() });
          exitosos++;
        } catch (err) {
          errores++;
          erroresDetalle.push(`Fila ${i + 6}: ${err.response?.data?.message || err.message}`);
        }
        setImportProgress({ current: i + 1, total: jsonData.length });
        if (i % 10 === 0 && i > 0) await new Promise(r => setTimeout(r, 80));
      }

      alert(`Importación completada:\n Exitosos: ${exitosos}\n Errores: ${errores}`);
      if (erroresDetalle.length) console.warn('Errores de importación:', erroresDetalle);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      alert(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFormId) { alert('Por favor seleccione un tipo de formulario'); return; }

    let gps_latitud  = null;
    let gps_longitud = null;

    if (!usaFormularioGenerico && formConfig?.secciones) {
      formConfig.secciones.forEach(sec => sec.campos.forEach(campo => {
        if (campo.tipo === 'map_picker') {
          gps_latitud  = parseFloat(formData[`${campo.id}_lat`]) || null;
          gps_longitud = parseFloat(formData[`${campo.id}_lng`]) || null;
        }
      }));

      const faltantes = [];
      formConfig.secciones.forEach(sec => sec.campos.forEach(campo => {
        if (!campo.requerido) return;
        if (campo.tipo === 'map_picker') {
          if (!gps_latitud || !gps_longitud) faltantes.push(campo.label);
        } else if (!formData[campo.id]) {
          faltantes.push(campo.label);
        }
      }));
      if (faltantes.length) {
        alert(`Por favor complete los campos requeridos:\n${faltantes.join('\n')}`);
        return;
      }
    } else {
      if (!formData.fecha_hecho) {
        alert('Por favor indique la fecha del hecho');
        return;
      }
      const tieneDatos = Object.entries(formData).some(([k, v]) => {
        if (CAMPOS_COLUMNA_PROPIA.has(k) || k.endsWith('_lat') || k.endsWith('_lng')) return false;
        return v !== undefined && v !== null && String(v).trim() !== '';
      });
      if (!tieneDatos) {
        alert('Ingrese al menos un dato en el detalle o campos adicionales');
        return;
      }
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = construirPayload(gps_latitud, gps_longitud);

      if (correctingId) {
        await axios.patch(
          `${API_BASE}/formularios/${correctingId}/corregir`,
          payload,
          { headers: getAuthHeader() },
        );
        alert('Formulario corregido y reenviado a validación correctamente');
        setCorrectingId(null);
        setFormData({});
        setSelectedFormId('');
        cargarObservados();
      } else {
        await axios.post(
          `${API_BASE}/formularios/registrar`,
          payload,
          { headers: getAuthHeader() },
        );
        alert('Formulario guardado y enviado a validación correctamente');
        setFormData({});
        setSelectedFormId('');
      }
    } catch (err) {
      console.error('Error al guardar formulario:', err);
      setSubmitError(err.response?.data?.message || 'Error al guardar el formulario');
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
            <h1 className="text-3xl font-bold text-policia-green">Carga y Transcripción de Datos</h1>
            <p className="text-gray-600 mt-1">Sistema de digitalización de formularios policiales con soporte para múltiples tipos de formularios</p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('nuevo')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'nuevo'
                ? 'border-policia-green text-policia-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Nuevo Registro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('observados')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'observados'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Observados
            {observados.length > 0 && activeTab !== 'observados' && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {observados.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pestaña Observados */}
      {activeTab === 'observados' && (
        <div className="p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Formularios Observados</h2>
                <p className="text-sm text-gray-500">Rechazados por el analista — corrija y reenvíe a validación</p>
              </div>
              <button
                type="button"
                onClick={cargarObservados}
                disabled={loadingObservados}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingObservados ? 'animate-spin' : ''} />
                Actualizar
              </button>
            </div>

            {loadingObservados ? (
              <div className="py-16 text-center text-gray-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-policia-green mx-auto mb-4" />
                <p>Cargando observados...</p>
              </div>
            ) : errorObservados ? (
              <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-red-700">Error al cargar la lista</p>
                    <p className="text-sm text-red-600 mt-1">{errorObservados}</p>
                    <button
                      type="button"
                      onClick={cargarObservados}
                      className="mt-3 text-sm font-semibold text-red-700 underline hover:no-underline"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            ) : observados.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <CheckCircle size={56} className="mx-auto text-gray-300" />
                <p className="font-semibold mt-4">No tiene formularios observados</p>
                <p className="text-sm text-gray-400 mt-1">Los rechazos del analista aparecerán aquí</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-6 py-3">Formulario</th>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Zona</th>
                      <th className="px-6 py-3 min-w-[280px]">Motivo de rechazo</th>
                      <th className="px-6 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {observados.map(reg => (
                      <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{reg.nombre_formulario || reg.formulario_codigo}</p>
                          <p className="text-xs text-gray-400">{reg.formulario_codigo}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                          {formatearFechaBolivia(reg.updated_at || reg.created_at)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{reg.zona || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-red-800 text-sm leading-snug">
                              {reg.motivo_rechazo || 'Sin motivo registrado'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleCorregir(reg)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-policia-green text-white rounded-xl hover:bg-policia-dark transition-colors font-semibold text-sm"
                          >
                            <Edit size={16} /> Corregir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña Nuevo Registro */}
      {activeTab === 'nuevo' && (
        <>
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
                    <option key={form.id} value={form.id}>{form.codigo} - {form.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                {selectedFormId && formConfig && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText size={18} />
                    <span className="font-semibold">{formConfig.nombre}</span>
                    {usaFormularioGenerico ? (
                      <span className="text-amber-600 font-semibold">• Modo genérico</span>
                    ) : (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>{formConfig.secciones.reduce((a, s) => a + s.campos.length, 0)} campos configurados</span>
                      </>
                    )}
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
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
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Procesando registros...</span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-policia-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {correctingId && (
            <div className="mx-8 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-sm text-amber-900">
                <span className="font-bold">Modo corrección</span> — Registro #{correctingId}. Al guardar se reenviará a validación.
              </p>
              <button
                type="button"
                onClick={cancelarCorreccion}
                className="text-sm font-semibold text-amber-800 hover:text-amber-950 shrink-0"
              >
                Cancelar corrección
              </button>
            </div>
          )}

          <div className="p-8">
            {!selectedFormId ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Seleccione un Formulario</h2>
                <p className="text-gray-500">Por favor seleccione un tipo de formulario para comenzar</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {usaFormularioGenerico ? (
                  <FormularioGenerico
                    formData={formData}
                    onChange={handleFieldChange}
                    titulo={formConfig?.nombre}
                    codigo={codigoActivo}
                  />
                ) : (
                  <DynamicFormRenderer
                    formId={selectedFormId}
                    formData={formData}
                    onChange={handleFieldChange}
                    onMapSelect={handleMapSelect}
                  />
                )}

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 shadow-lg z-10">
                  <div className="max-w-7xl mx-auto">
                    {submitError && (
                      <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-red-700">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
                      >
                        <X size={20} /> Limpiar Formulario
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-3 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 ${
                          correctingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-policia-green hover:bg-policia-dark'
                        }`}
                      >
                        {submitting
                          ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Guardando...</span></>
                          : <><Save size={20} /><span>{correctingId ? 'Reenviar a Validación' : 'Guardar y Enviar a Validación'}</span></>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {showMapPicker && (
            <MapPicker
              onSelect={handleMapCoordinatesSelect}
              onClose={() => setShowMapPicker(false)}
              initialLat={formData[`${mapPickerFieldId}_lat`]}
              initialLng={formData[`${mapPickerFieldId}_lng`]}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CargaDatos;
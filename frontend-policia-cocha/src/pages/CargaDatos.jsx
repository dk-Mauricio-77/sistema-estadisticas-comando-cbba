import React, { useState } from 'react';
import axios from 'axios';
import { Save, MapPin, User, FileText, AlertCircle } from 'lucide-react';

const CargaDatos = () => {
  const [formData, setFormData] = useState({
    incidente: { codigo_caso: '', fecha_hora: '', gps_latitud: '', gps_longitud: '', zona: '', tipo_hecho: 'COLISION' },
    protagonista: { conductor_nombre: '', placa_vehiculo: '', soat: false, grado_alcoholico: 0, tipo_vehiculo: '' },
    estadisticas: { rango_edad: '18-30', sexo: 'M', condicion: 'HERIDO', cantidad: 1 }
  });

  const handleChange = (seccion, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [seccion]: { ...prev[seccion], [campo]: valor }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convertir a números antes de enviar
      const payload = {
        ...formData,
        incidente: {
          ...formData.incidente,
          gps_latitud: parseFloat(formData.incidente.gps_latitud),
          gps_longitud: parseFloat(formData.incidente.gps_longitud)
        },
        estadisticas: {
          ...formData.estadisticas,
          cantidad: parseInt(formData.estadisticas.cantidad)
        }
      };

      await axios.post('http://localhost:3001/api/formularios/transito', payload);
      alert('Formulario guardado exitosamente');
      // Limpiar formulario o redirigir
    } catch (error) {
      console.error(error);
      alert('Error al guardar. Revisa la consola.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-policia-green">Recepción de Formularios</h1>
        <p className="text-gray-500">Formulario 03A - Hechos de Tránsito</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Incidente */}
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-policia-green">
          <div className="flex items-center gap-2 mb-4 text-policia-green font-bold text-lg">
            <MapPin /> Datos del Incidente
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Código Caso (Ej: CASO-99)" className="border p-2 rounded" required 
              onChange={e => handleChange('incidente', 'codigo_caso', e.target.value)} />
            <input type="datetime-local" className="border p-2 rounded" required 
              onChange={e => handleChange('incidente', 'fecha_hora', e.target.value)} />
            <select className="border p-2 rounded" onChange={e => handleChange('incidente', 'tipo_hecho', e.target.value)}>
              <option value="COLISION">Colisión</option>
              <option value="ATROPELLO">Atropello</option>
              <option value="ROBO">Robo Vehículo</option>
            </select>
            <input type="number" placeholder="Latitud (Ej: -17.39)" step="any" className="border p-2 rounded" required 
              onChange={e => handleChange('incidente', 'gps_latitud', e.target.value)} />
            <input type="number" placeholder="Longitud (Ej: -66.15)" step="any" className="border p-2 rounded" required 
              onChange={e => handleChange('incidente', 'gps_longitud', e.target.value)} />
            <input type="text" placeholder="Zona/Barrio" className="border p-2 rounded" required 
              onChange={e => handleChange('incidente', 'zona', e.target.value)} />
          </div>
        </div>

        {/* Sección 2: Protagonista */}
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600">
          <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold text-lg">
            <User /> Protagonista Principal
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nombre Conductor" className="border p-2 rounded" required 
              onChange={e => handleChange('protagonista', 'conductor_nombre', e.target.value)} />
            <input type="text" placeholder="Placa Vehículo" className="border p-2 rounded" required 
              onChange={e => handleChange('protagonista', 'placa_vehiculo', e.target.value)} />
            <input type="number" placeholder="Grado Alcohólico" step="0.1" className="border p-2 rounded" 
              onChange={e => handleChange('protagonista', 'grado_alcoholico', e.target.value)} />
            <label className="flex items-center gap-2 p-2 border rounded bg-gray-50">
              <input type="checkbox" onChange={e => handleChange('protagonista', 'soat', e.target.checked)} />
              ¿Tiene SOAT Vigente?
            </label>
          </div>
        </div>

        {/* Sección 3: Estadísticas */}
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-orange-500">
          <div className="flex items-center gap-2 mb-4 text-orange-700 font-bold text-lg">
            <FileText /> Estadísticas de Víctimas
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select className="border p-2 rounded" onChange={e => handleChange('estadisticas', 'rango_edad', e.target.value)}>
              <option value="18-30">18 a 30 años</option>
              <option value="31-45">31 a 45 años</option>
              <option value="0-12">0 a 12 años</option>
            </select>
            <select className="border p-2 rounded" onChange={e => handleChange('estadisticas', 'sexo', e.target.value)}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            <select className="border p-2 rounded" onChange={e => handleChange('estadisticas', 'condicion', e.target.value)}>
              <option value="HERIDO">Herido</option>
              <option value="MUERTO">Fallecido</option>
            </select>
            <input type="number" min="1" value={formData.estadisticas.cantidad} className="border p-2 rounded" 
              onChange={e => handleChange('estadisticas', 'cantidad', e.target.value)} />
          </div>
        </div>

        <button type="submit" className="bg-policia-green text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-green-800 w-full flex justify-center items-center gap-2 text-xl transition-transform hover:scale-[1.01]">
          <Save /> GUARDAR FORMULARIO OFICIAL
        </button>
      </form>
    </div>
  );
};

export default CargaDatos;
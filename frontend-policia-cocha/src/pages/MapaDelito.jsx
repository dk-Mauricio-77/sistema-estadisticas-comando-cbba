import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css'; // <--- ¡CRUCIAL! Sin esto, el mapa se ve roto

const MapaDelito = () => {
  const [puntos, setPuntos] = useState([]);

  useEffect(() => {
    const cargarPuntos = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/analitica/mapa');
        setPuntos(res.data);
      } catch (error) {
        console.error("Error cargando mapa:", error);
      }
    };
    cargarPuntos();
  }, []);

  // Función para elegir color según el delito
  const getColor = (tipo) => {
    if (tipo === 'COLISION') return 'red';
    if (tipo === 'ATROPELLO') return 'orange';
    if (tipo === 'ROBO') return 'blue';
    return 'gray';
  };

  return (
    <div className="h-full w-full p-4 flex flex-col">
      <h2 className="text-2xl font-bold text-policia-green mb-4">Mapa de Calor Delictual</h2>
      
      {/* Contenedor con altura forzada */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200" style={{ minHeight: '500px' }}>
        <MapContainer 
          center={[-17.3935, -66.1570]} // Centro en Cochabamba
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {puntos.map((p, idx) => (
            <CircleMarker
              key={idx}
              center={[parseFloat(p.gps_latitud), parseFloat(p.gps_longitud)]}
              radius={8}
              pathOptions={{ color: getColor(p.tipo_hecho), fillColor: getColor(p.tipo_hecho), fillOpacity: 0.7 }}
            >
              <Popup>
                <strong>{p.tipo_hecho}</strong><br />
                {p.zona}<br />
                {new Date(p.fecha_hora).toLocaleDateString()}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaDelito;
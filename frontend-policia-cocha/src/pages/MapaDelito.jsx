import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import { API_BASE } from '../config/api';

/**
 * Componente interno para renderizar la capa de heatmap
 * Usa el hook useMap para acceder a la instancia del mapa
 */
const HeatmapLayer = ({ puntos }) => {
  const map = useMap();

  useEffect(() => {
    if (!puntos || puntos.length === 0) {
      return;
    }

    // Convertir puntos a formato [[lat, lng, intensidad], ...]
    const heatPoints = puntos
      .map(p => {
        const lat = parseFloat(p.gps_latitud);
        const lng = parseFloat(p.gps_longitud);
        
        // Validar coordenadas válidas
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          return null;
        }

        // Intensidad basada en el tipo de hecho (puede ajustarse)
        let intensidad = 1.0;
        if (p.tipo_hecho) {
          const tipoUpper = p.tipo_hecho.toUpperCase();
          if (tipoUpper.includes('MUERTO') || tipoUpper.includes('FALLECIDO')) {
            intensidad = 2.0; // Mayor intensidad para casos graves
          } else if (tipoUpper.includes('HERIDO')) {
            intensidad = 1.5;
          }
        }

        return [lat, lng, intensidad];
      })
      .filter(point => point !== null);

    if (heatPoints.length === 0) {
      return;
    }

    // Crear capa de heatmap con configuración optimizada
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.4,
      max: 2.0,
      gradient: {
        0.0: 'blue',
        0.3: 'cyan',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    });

    heatLayer.addTo(map);

    // Limpiar la capa cuando el componente se desmonte o los puntos cambien
    return () => {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, puntos]);

  return null;
};

const MapaDelito = () => {
  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPuntos = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/analitica/mapa`);
        setPuntos(res.data || []);
      } catch (error) {
        console.error('Error cargando mapa:', error);
        setPuntos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarPuntos();
  }, []);

  // Filtrar y validar puntos con coordenadas válidas
  const puntosValidos = puntos.filter(p => {
    const lat = parseFloat(p.gps_latitud);
    const lng = parseFloat(p.gps_longitud);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });

  return (
    <div className="h-full w-full p-4 flex flex-col">
      <h2 className="text-2xl font-bold text-policia-green mb-4">Mapa de Calor Delictual</h2>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-policia-green"></div>
            <p className="text-policia-green font-semibold">Cargando mapa de calor...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200" style={{ minHeight: '500px' }}>
          <MapContainer 
            center={[-17.3935, -66.1570]}
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {puntosValidos.length > 0 ? (
              <HeatmapLayer puntos={puntosValidos} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-[1000] pointer-events-none">
                <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                  <p className="text-gray-700 font-semibold">No hay puntos registrados</p>
                  <p className="text-gray-500 text-sm mt-2">Los incidentes con coordenadas aparecerán como mapa de calor</p>
                </div>
              </div>
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default MapaDelito;

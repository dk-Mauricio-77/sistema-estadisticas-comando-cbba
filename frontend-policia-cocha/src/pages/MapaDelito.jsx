import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import { API_BASE } from '../config/api';

/**
 * Capa de heatmap. Recibe únicamente puntos ya validados y con coordenadas dentro de Bolivia.
 * La intensidad se pondera por gravedad del hecho.
 */
const HeatmapLayer = ({ puntos }) => {
  const map = useMap();

  useEffect(() => {
    if (!puntos || puntos.length === 0) return;

    const heatPoints = puntos.map(p => {
      let intensidad = 1.0;
      if (p.tipo_hecho) {
        const t = p.tipo_hecho.toUpperCase();
        if (t.includes('MUERTO') || t.includes('FALLECIDO')) intensidad = 2.0;
        else if (t.includes('HERIDO')) intensidad = 1.5;
      }
      return [parseFloat(p.gps_latitud), parseFloat(p.gps_longitud), intensidad];
    });

    const heatLayer = L.heatLayer(heatPoints, {
      radius:     25,
      blur:       15,
      maxZoom:    17,
      minOpacity: 0.4,
      max:        2.0,
      gradient: {
        0.0: 'blue',
        0.3: 'cyan',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red',
      },
    });

    heatLayer.addTo(map);

    return () => {
      if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    };
  }, [map, puntos]);

  return null;
};

const MapaDelito = () => {
  const [puntos, setPuntos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const cargarPuntos = async () => {
      try {
        setLoading(true);
        setError(null);
        // El parámetro estado=validado filtra en el backend.
        // El filtro defensivo en puntosValidos cubre coordenadas corruptas que escapen el SQL.
        const res = await axios.get(`${API_BASE}/analitica/mapa`, {
          params: { estado: 'validado' },
        });
        setPuntos(res.data || []);
      } catch (err) {
        console.error('Error cargando mapa:', err);
        setError('No se pudo conectar con el servidor de analítica.');
        setPuntos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarPuntos();
  }, []);

  // Filtro defensivo en frontend: bounding box aproximado de Bolivia
  const puntosValidos = puntos.filter(p => {
    const lat = parseFloat(p.gps_latitud);
    const lng = parseFloat(p.gps_longitud);
    return (
      !isNaN(lat) && !isNaN(lng) &&
      lat !== 0   && lng !== 0   &&
      lat >= -23  && lat <= -9   &&
      lng >= -70  && lng <= -57
    );
  });

  return (
    <div className="h-full w-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-policia-green">Mapa de Calor Delictual</h2>
        {!loading && !error && (
          <span className="text-sm text-gray-500 font-semibold">
            {puntosValidos.length} incidente{puntosValidos.length !== 1 ? 's' : ''} validado{puntosValidos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-policia-green" />
            <p className="text-policia-green font-semibold">Cargando mapa de calor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center bg-red-50 rounded-xl border border-red-200">
          <div className="text-center p-8">
            <p className="text-red-700 font-semibold">{error}</p>
            <p className="text-red-400 text-sm mt-2">Verifique la conexión con el backend en {API_BASE}</p>
          </div>
        </div>
      ) : (
        <div
          className="flex-1 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200"
          style={{ minHeight: '500px' }}
        >
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
                  <p className="text-gray-700 font-semibold">No hay incidentes validados con coordenadas</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Solo los registros en estado <strong>validado</strong> con GPS aparecen aquí
                  </p>
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
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Componente interno para capturar clics en el mapa
 */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

/**
 * Componente para seleccionar coordenadas en un mapa
 * @param {Object} props
 * @param {Function} props.onSelect - Callback cuando se selecciona una coordenada (lat, lng)
 * @param {Function} props.onClose - Callback para cerrar el modal
 * @param {number} props.initialLat - Latitud inicial
 * @param {number} props.initialLng - Longitud inicial
 */
const MapPicker = ({ onSelect, onClose, initialLat = -17.3935, initialLng = -66.1570 }) => {
  const [position, setPosition] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : [-17.3935, -66.1570]
  );

  const handleMapClick = (latlng) => {
    setPosition([latlng.lat, latlng.lng]);
  };

  const handleConfirm = () => {
    onSelect(position[0], position[1]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-policia-green">Seleccionar Coordenadas en el Mapa</h3>
          <p className="text-sm text-gray-600 mt-1">Haga clic en el mapa para seleccionar la ubicación</p>
        </div>
        
        <div className="flex-1 p-6">
          <div className="h-[500px] rounded-xl overflow-hidden border border-gray-300">
            <MapContainer
              center={position}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              <Marker position={position} />
            </MapContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-700 mb-2">Coordenadas seleccionadas:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Latitud</label>
                <input
                  type="number"
                  value={position[0]}
                  onChange={(e) => setPosition([parseFloat(e.target.value) || 0, position[1]])}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Longitud</label>
                <input
                  type="number"
                  value={position[1]}
                  onChange={(e) => setPosition([position[0], parseFloat(e.target.value) || 0])}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-policia-green text-white rounded-xl hover:bg-policia-dark transition-colors font-semibold"
          >
            Confirmar Coordenadas
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;

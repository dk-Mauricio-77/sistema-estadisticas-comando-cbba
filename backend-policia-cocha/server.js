
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importamos la ruta
const rutasTransito = require('./routes/transito'); 
const rutasDashboard = require('./routes/dashboard');
const rutasUsuarios = require('./routes/usuarios');
const rutasRecepcion = require('./routes/recepcion');

const app = express();
const port = process.env.PORT || 3001;

const rutasMapa = require('./routes/mapa');
const axios = require('axios');

// Configuración CORS para aceptar peticiones del frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Usamos la ruta
app.use('/api/formularios/transito', rutasTransito);
app.use('/api/analitica/dashboard', rutasDashboard);
app.use('/api/analitica/mapa', rutasMapa);
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/recepcion', rutasRecepcion);

app.get('/', (req, res) => {
    res.send('API Policia Cochabamba Funcionando');
});

app.listen(port, () => {
    console.log(`Servidor Express iniciado en http://localhost:${port}`);
});

app.get('/api/analitica/mapa', async (req, res) => {
    try {
        // Simulación de datos de ejemplo
        const datosMapa = [
            { gps_latitud: -17.3935, gps_longitud: -66.1570, tipo_hecho: 'COLISION', zona: 'Zona Central', fecha_hora: '2023-10-01T10:00:00Z' },
            { gps_latitud: -17.3940, gps_longitud: -66.1580, tipo_hecho: 'ATROPELLO', zona: 'Zona Norte', fecha_hora: '2023-10-02T12:30:00Z' },
            { gps_latitud: -17.3950, gps_longitud: -66.1590, tipo_hecho: 'ROBO', zona: 'Zona Sur', fecha_hora: '2023-10-03T15:45:00Z' },
        ];

        res.json(datosMapa);
    } catch (error) {
        console.error('Error al obtener los datos del mapa:', error);
        res.status(500).json({ error: 'Error al obtener los datos del mapa' });
    }
});
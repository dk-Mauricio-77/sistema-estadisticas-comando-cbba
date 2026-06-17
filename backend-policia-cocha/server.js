require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const rutasAuth                  = require('./routes/auth');
const rutasTransito               = require('./routes/transito');
const rutasDashboard              = require('./routes/dashboard');
const rutasDashboardEstadisticas  = require('./routes/dashboardEstadisticas');
const rutasMapa                   = require('./routes/mapa');
const rutasUsuarios               = require('./routes/usuarios');
const rutasRecepcion              = require('./routes/recepcion');
const rutasIncidentes             = require('./routes/incidentes');
const rutasFormularios            = require('./routes/formularios');

const app  = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin:         ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Rutas de la API
app.use('/api/auth',              rutasAuth);
app.use('/api/formularios/transito', rutasTransito);
app.use('/api/analitica/dashboard',  rutasDashboard);
app.use('/api/dashboard',            rutasDashboardEstadisticas);
app.use('/api/analitica/mapa',       rutasMapa);
app.use('/api/usuarios',             rutasUsuarios);
app.use('/api/recepcion',            rutasRecepcion);
app.use('/api/incidentes',           rutasIncidentes);
app.use('/api/formularios',          rutasFormularios);

app.get('/', (_req, res) => res.send('API Policia Cochabamba Funcionando'));

app.listen(port, () => {
  console.log(`Servidor Express iniciado en http://localhost:${port}`);
});
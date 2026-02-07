const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/analitica/mapa
router.get('/', async (req, res) => {
    try {
        // Seleccionamos solo los datos necesarios para el mapa
        // y filtramos para que NO traiga nulos (IS NOT NULL) y no rompa el mapa
        const query = `
            SELECT id_incidente, tipo_hecho, zona, gps_latitud, gps_longitud, fecha_hora 
            FROM incidentes_transito 
            WHERE gps_latitud IS NOT NULL AND gps_longitud IS NOT NULL
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en mapa:', error);
        res.status(500).json({ error: 'Error al obtener puntos del mapa' });
    }
});

module.exports = router;

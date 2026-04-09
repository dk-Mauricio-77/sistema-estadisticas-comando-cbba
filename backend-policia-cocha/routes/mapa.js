const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * GET /api/analitica/mapa
 * Obtiene coordenadas de incidentes desde la tabla incidentes para el mapa de calor
 */
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                latitud,
                longitud,
                tipo_formulario,
                fecha_hora_hecho,
                COALESCE(
                    NULLIF(datos_especificos->>'zona_hecho', ''),
                    NULLIF(datos_especificos->>'zona_del_hecho', ''),
                    'Sin zona'
                ) as zona,
                COALESCE(
                    NULLIF(datos_especificos->>'clasificacion_hecho', ''),
                    NULLIF(datos_especificos->>'clasificacion_del_hecho', ''),
                    tipo_formulario
                ) as tipo_hecho
            FROM incidentes 
            WHERE latitud IS NOT NULL 
            AND longitud IS NOT NULL
            AND latitud != 0 
            AND longitud != 0
            ORDER BY fecha_hora_hecho DESC
        `;
        
        const result = await pool.query(query);
        console.log(`Mapa consultado exitosamente. Puntos encontrados: ${result.rows.length}`);
        
        // Formatear datos para el frontend
        const puntosFormateados = result.rows.map(row => ({
            id: row.id,
            gps_latitud: parseFloat(row.latitud),
            gps_longitud: parseFloat(row.longitud),
            tipo_hecho: row.tipo_hecho || row.tipo_formulario || 'Sin clasificar',
            zona: row.zona || 'Sin zona',
            fecha_hora: row.fecha_hora_hecho
        }));
        
        res.json(puntosFormateados);
    } catch (error) {
        console.error('Error en mapa:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Error al obtener puntos del mapa',
            detalle: error.message 
        });
    }
});

module.exports = router;

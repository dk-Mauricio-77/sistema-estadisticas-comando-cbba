const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Endpoint: GET /api/analitica/dashboard?periodo=hoy
router.get('/', async (req, res) => {
    try {
        const { periodo } = req.query;
        let filtroSQL = "";

        // Lógica de Filtros Temporales (PostgreSQL)
        switch (periodo) {
            case 'hoy':
                filtroSQL = "WHERE fecha_hora >= CURRENT_DATE"; // Desde las 00:00 de hoy
                break;
            case 'semana':
                filtroSQL = "WHERE fecha_hora >= NOW() - INTERVAL '1 week'"; // Últimos 7 días
                break;
            case 'mes':
                filtroSQL = "WHERE fecha_hora >= NOW() - INTERVAL '1 month'"; // Último mes
                break;
            case 'anio':
                filtroSQL = "WHERE fecha_hora >= NOW() - INTERVAL '1 year'"; // Último año
                break;
            default:
                filtroSQL = ""; // Histórico completo (si es 'todos' o vacío)
                break;
        }

        // Ejecutamos las 3 consultas en paralelo inyectando el filtro
        const [resumenRes, tiposRes, zonasRes] = await Promise.all([
            // 1. KPIs
            pool.query(`
                SELECT 
                    COUNT(*)::int as total_incidentes,
                    SUM(CASE WHEN estado = 'CERRADO' THEN 1 ELSE 0 END)::int as casos_resueltos
                FROM incidentes_transito ${filtroSQL}
            `),
            
            // 2. Gráfico Torta (Tipos)
            pool.query(`
                SELECT tipo_hecho, COUNT(*)::int as cantidad
                FROM incidentes_transito
                ${filtroSQL}
                GROUP BY tipo_hecho
                ORDER BY cantidad DESC
            `),

            // 3. Gráfico Barras (Zonas)
            pool.query(`
                SELECT zona, COUNT(*)::int as cantidad
                FROM incidentes_transito
                ${filtroSQL}
                GROUP BY zona
                ORDER BY cantidad DESC
                LIMIT 5
            `)
        ]);

        // Armamos el JSON final
        const total = parseInt(resumenRes.rows[0]?.total_incidentes || 0);
        const resueltos = parseInt(resumenRes.rows[0]?.casos_resueltos || 0);

        const dataDashboard = {
            kpis: {
                total_incidentes: total,
                casos_resueltos: resueltos,
                eficacia: total > 0 ? ((resueltos / total) * 100).toFixed(1) + '%' : '0%'
            },
            graficos: {
                por_tipo: tiposRes.rows,
                por_zona: zonasRes.rows
            }
        };

        res.json(dataDashboard);

    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
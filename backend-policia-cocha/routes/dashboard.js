const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * GET /api/analitica/dashboard?periodo=hoy
 * Obtiene datos del dashboard desde la tabla incidentes con JSONB
 */
router.get('/', async (req, res) => {
    try {
        const { periodo } = req.query;
        let filtroSQL = "";

        // Lógica de Filtros Temporales (PostgreSQL)
        switch (periodo) {
            case 'hoy':
                filtroSQL = "WHERE fecha_hora_hecho >= CURRENT_DATE";
                break;
            case 'semana':
                filtroSQL = "WHERE fecha_hora_hecho >= NOW() - INTERVAL '1 week'";
                break;
            case 'mes':
                filtroSQL = "WHERE fecha_hora_hecho >= NOW() - INTERVAL '1 month'";
                break;
            case 'anio':
                filtroSQL = "WHERE fecha_hora_hecho >= NOW() - INTERVAL '1 year'";
                break;
            default:
                filtroSQL = "";
                break;
        }

        // Ejecutamos las consultas en paralelo
        const [resumenRes, tiposRes, zonasRes, victimasRes] = await Promise.all([
            // 1. KPIs: Total de incidentes
            pool.query(`
                SELECT COUNT(*)::int as total_incidentes
                FROM incidentes
                ${filtroSQL}
            `),
            
            // 2. Gráfico Torta: Agrupar por clasificacion_hecho desde JSONB
            pool.query(`
                SELECT 
                    COALESCE(datos_especificos->>'clasificacion_hecho', 'Sin clasificar') as tipo_hecho,
                    COUNT(*)::int as cantidad
                FROM incidentes
                ${filtroSQL}
                GROUP BY datos_especificos->>'clasificacion_hecho'
                ORDER BY cantidad DESC
            `),

            // 3. Gráfico Barras: Top 5 zonas desde JSONB
            // Buscar en zona_hecho o zona_del_hecho (compatibilidad)
            pool.query(`
                SELECT 
                    COALESCE(
                        NULLIF(datos_especificos->>'zona_hecho', ''),
                        NULLIF(datos_especificos->>'zona_del_hecho', ''),
                        'Sin zona'
                    ) as zona,
                    COUNT(*)::int as cantidad
                FROM incidentes
                ${filtroSQL}
                GROUP BY 
                    COALESCE(
                        NULLIF(datos_especificos->>'zona_hecho', ''),
                        NULLIF(datos_especificos->>'zona_del_hecho', ''),
                        'Sin zona'
                    )
                ORDER BY cantidad DESC
                LIMIT 5
            `),

            // 4. KPIs de Víctimas: Sumar desde JSONB
            pool.query(`
                SELECT 
                    COALESCE(SUM(CAST(datos_especificos->>'total_heridos' AS INTEGER)), 0)::int as total_heridos,
                    COALESCE(SUM(CAST(datos_especificos->>'total_muertos' AS INTEGER)), 0)::int as total_muertos
                FROM incidentes
                ${filtroSQL}
            `)
        ]);

        // Procesar resultados
        const total = parseInt(resumenRes.rows[0]?.total_incidentes || 0);
        const totalHeridos = parseInt(victimasRes.rows[0]?.total_heridos || 0);
        const totalMuertos = parseInt(victimasRes.rows[0]?.total_muertos || 0);
        const totalVictimas = totalHeridos + totalMuertos;

        // Calcular eficacia (casos resueltos / total) - por ahora usamos total como placeholder
        const casosResueltos = 0; // TODO: Implementar lógica de casos resueltos desde JSONB
        const eficacia = total > 0 ? ((casosResueltos / total) * 100).toFixed(1) + '%' : '0%';

        // Formatear datos de gráficos
        const porTipo = tiposRes.rows.length > 0 ? tiposRes.rows : [{ tipo_hecho: 'Sin datos', cantidad: 0 }];
        const porZona = zonasRes.rows.length > 0 ? zonasRes.rows : [{ zona: 'Sin datos', cantidad: 0 }];

        const dataDashboard = {
            kpis: {
                total_incidentes: total,
                total_heridos: totalHeridos,
                total_muertos: totalMuertos,
                total_victimas: totalVictimas,
                casos_resueltos: casosResueltos,
                eficacia: eficacia
            },
            graficos: {
                por_tipo: porTipo,
                por_zona: porZona
            }
        };

        console.log(`Dashboard consultado exitosamente. Período: ${periodo || 'todos'}, Total incidentes: ${total}`);
        res.json(dataDashboard);

    } catch (error) {
        console.error('Error en dashboard:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            detalle: error.message 
        });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const FILTROS_TIPO = {
    todos:    '',
    felcv:    "AND (rf.formulario_codigo LIKE 'FELCV%' OR fc.categoria = 'felcv')",
    transito: "AND (rf.formulario_codigo IN ('03A','03B') OR fc.categoria = 'transito')",
    diprove:  "AND (rf.formulario_codigo LIKE 'DIPROVE%' OR fc.categoria = 'diprove')",
};

const CAMPOS_JSONB_POR_TIPO = {
    transito: ['causas', 'clasificacion_hecho', 'sub_clasificacion_hechos', 'tipo_denuncia', 'estado_via'],
    felcv:    ['parentesco', 'relacion_victima_agresor', 'tipo_violencia', 'ocupacion_agresor'],
    diprove:  ['marca', 'color', 'modelo', 'tipo_vehiculo', 'placa'],
};

const TITULOS_GRAFICO = {
    transito: 'Distribución por Causas / Clasificación',
    felcv:    'Distribución por Parentesco / Tipo de Violencia',
    diprove:  'Distribución por Marca / Modelo',
};

const agruparPorCampoJsonb = async (campo, filtroExtra) => {
    const result = await pool.query(
        `SELECT
            COALESCE(NULLIF(TRIM(rf.datos_especificos->>$1), ''), 'Sin dato') AS etiqueta,
            COUNT(*)::integer AS cantidad
         FROM registros_formularios rf
         JOIN formularios_catalogo fc ON rf.formulario_codigo = fc.codigo
         WHERE rf.estado = 'validado' ${filtroExtra}
         GROUP BY 1
         HAVING COUNT(*) > 0
         ORDER BY cantidad DESC
         LIMIT 12`,
        [campo]
    );
    return result.rows;
};

const elegirGraficoDinamico = async (tipo, filtroExtra) => {
    const campos = CAMPOS_JSONB_POR_TIPO[tipo] || ['detalle_general'];
    for (const campo of campos) {
        const filas = await agruparPorCampoJsonb(campo, filtroExtra);
        const conDatos = filas.filter((f) => f.etiqueta !== 'Sin dato');
        if (conDatos.length > 0) {
            return {
                titulo: `${TITULOS_GRAFICO[tipo] || 'Distribución'} (${campo.replace(/_/g, ' ')})`,
                campo,
                tipo_grafico: conDatos.length <= 6 ? 'pie' : 'bar',
                datos: filas,
            };
        }
    }
    return {
        titulo: 'Sin datos JSONB para graficar',
        campo: null,
        tipo_grafico: 'bar',
        datos: [],
    };
};

/**
 * GET /api/dashboard/estadisticas?tipo_formulario=todos|felcv|transito|diprove
 * Solo registros con estado = 'validado'
 */
router.get('/estadisticas', async (req, res) => {
    try {
        const tipoRaw = (req.query.tipo_formulario || 'todos').toLowerCase();
        const tipo = FILTROS_TIPO[tipoRaw] !== undefined ? tipoRaw : 'todos';
        const filtroExtra = FILTROS_TIPO[tipo];

        const [kpisRes, porZonaRes, porFormularioRes, porMesRes] = await Promise.all([
            pool.query(
                `SELECT
                    COUNT(*)::integer AS total_registros,
                    COALESCE(SUM(rf.total_casos), 0)::integer AS total_casos,
                    COALESCE(SUM(rf.total_heridos), 0)::integer AS total_heridos,
                    COALESCE(SUM(rf.total_muertos), 0)::integer AS total_muertos
                 FROM registros_formularios rf
                 JOIN formularios_catalogo fc ON rf.formulario_codigo = fc.codigo
                 WHERE rf.estado = 'validado' ${filtroExtra}`
            ),
            pool.query(
                `SELECT
                    COALESCE(NULLIF(TRIM(rf.zona), ''), 'Sin zona') AS zona,
                    COUNT(*)::integer AS cantidad
                 FROM registros_formularios rf
                 JOIN formularios_catalogo fc ON rf.formulario_codigo = fc.codigo
                 WHERE rf.estado = 'validado' ${filtroExtra}
                 GROUP BY 1
                 ORDER BY cantidad DESC
                 LIMIT 8`
            ),
            pool.query(
                `SELECT
                    rf.formulario_codigo AS codigo,
                    fc.nombre,
                    fc.categoria,
                    COUNT(*)::integer AS cantidad
                 FROM registros_formularios rf
                 JOIN formularios_catalogo fc ON rf.formulario_codigo = fc.codigo
                 WHERE rf.estado = 'validado' ${filtroExtra}
                 GROUP BY rf.formulario_codigo, fc.nombre, fc.categoria
                 ORDER BY cantidad DESC`
            ),
            pool.query(
                `SELECT
                    rf.mes_registro AS mes,
                    COUNT(*)::integer AS cantidad
                 FROM registros_formularios rf
                 JOIN formularios_catalogo fc ON rf.formulario_codigo = fc.codigo
                 WHERE rf.estado = 'validado' ${filtroExtra}
                 GROUP BY rf.mes_registro
                 ORDER BY rf.mes_registro`
            ),
        ]);

        const kpis = kpisRes.rows[0] || {};
        const total = kpis.total_registros || 0;
        const eficacia = total > 0
            ? `${Math.round((total / (total + 1)) * 100)}%`
            : '0%';

        let graficoDinamico = null;
        if (tipo !== 'todos') {
            graficoDinamico = await elegirGraficoDinamico(tipo, filtroExtra);
        }

        res.json({
            tipo_formulario: tipo,
            kpis: {
                total_registros: total,
                total_casos:     kpis.total_casos || 0,
                total_heridos:   kpis.total_heridos || 0,
                total_muertos:   kpis.total_muertos || 0,
                eficacia,
            },
            graficos: {
                por_zona:       porZonaRes.rows,
                por_formulario: porFormularioRes.rows,
                por_mes:        porMesRes.rows.map((r) => ({
                    mes: r.mes,
                    cantidad: r.cantidad,
                    etiqueta: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][r.mes - 1] || `Mes ${r.mes}`,
                })),
                dinamico: graficoDinamico,
            },
        });
    } catch (err) {
        console.error('Error en /dashboard/estadisticas:', err);
        res.status(500).json({ message: 'Error al obtener estadísticas del dashboard', detalle: err.message });
    }
});

module.exports = router;

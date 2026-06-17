const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/** Filtros legacy por categoría (compatibilidad) */
const FILTROS_CATEGORIA = {
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

const BASE_FROM = `
    FROM registros_formularios rf
    JOIN formularios_catalogo fc ON rf.formulario_codigo = fc.codigo
    WHERE rf.estado = 'validado'
`;

/**
 * Resuelve la cláusula SQL del filtro maestro.
 * - todos → sin filtro
 * - felcv|transito|diprove → categorías legacy
 * - cualquier otro valor → código exacto de formulario (ej. 03A, FELCV-FEM)
 */
const resolverFiltroSQL = (tipoRaw) => {
    const tipo = String(tipoRaw || 'todos').trim();
    const tipoLower = tipo.toLowerCase();

    if (!tipo || tipoLower === 'todos') {
        return { clausula: '', tipoGrafico: 'todos', codigoExacto: null };
    }

    if (FILTROS_CATEGORIA[tipoLower]) {
        return { clausula: FILTROS_CATEGORIA[tipoLower], tipoGrafico: tipoLower, codigoExacto: null };
    }

    const codigoEscapado = tipo.replace(/'/g, "''");
    return {
        clausula: `AND rf.formulario_codigo = '${codigoEscapado}'`,
        tipoGrafico: tipoLower,
        codigoExacto: tipo,
    };
};

const inferirCategoriaGrafico = (tipoGrafico, codigoExacto) => {
    const ref = (codigoExacto || tipoGrafico || '').toUpperCase();
    if (ref.includes('FELCV')) return 'felcv';
    if (ref === '03A' || ref === '03B' || ref.includes('TRANSITO') || ref.startsWith('03')) return 'transito';
    if (ref.includes('DIPROVE')) return 'diprove';
    return tipoGrafico;
};

const esFormulario03A = (codigoExacto) =>
    String(codigoExacto || '').trim().toUpperCase() === '03A';

const agruparPorCampoJsonb = async (campo, filtroExtra, limite = 12) => {
    const result = await pool.query(
        `SELECT
            COALESCE(NULLIF(TRIM(rf.datos_especificos->>$1), ''), 'Sin dato') AS etiqueta,
            COUNT(*)::integer AS cantidad
         ${BASE_FROM} ${filtroExtra}
         GROUP BY 1
         HAVING COUNT(*) > 0
         ORDER BY cantidad DESC
         LIMIT $2`,
        [campo, limite]
    );
    return result.rows;
};

const elegirGraficoDinamico = async (tipoGrafico, filtroExtra, codigoExacto) => {
    const categoria = inferirCategoriaGrafico(tipoGrafico, codigoExacto);
    const campos = CAMPOS_JSONB_POR_TIPO[categoria] || [
        'detalle_general', 'clasificacion_hecho', 'causas', 'tipo_denuncia', 'marca', 'parentesco',
    ];

    for (const campo of campos) {
        const filas = await agruparPorCampoJsonb(campo, filtroExtra);
        const conDatos = filas.filter((f) => f.etiqueta !== 'Sin dato');
        if (conDatos.length > 0) {
            return {
                titulo: `${TITULOS_GRAFICO[categoria] || 'Distribución'} (${campo.replace(/_/g, ' ')})`,
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
 * Métricas analíticas extendidas del Formulario 03A (Hechos de Tránsito).
 * Extrae agregaciones desde datos_especificos JSONB sobre registros validados.
 */
const obtenerMetricasTransito03A = async (filtroExtra) => {
    const [
        clasificacionRes,
        causasRes,
        estadoViaRes,
        soatRes,
        sexoRes,
        rangosEdadRes,
        severidadRes,
    ] = await Promise.all([
        pool.query(
            `SELECT
                COALESCE(NULLIF(TRIM(rf.datos_especificos->>'clasificacion_hecho'), ''), 'Sin dato') AS etiqueta,
                COUNT(*)::integer AS cantidad
             ${BASE_FROM} ${filtroExtra}
             GROUP BY 1
             HAVING COUNT(*) > 0
             ORDER BY cantidad DESC
             LIMIT 15`
        ),
        pool.query(
            `SELECT
                COALESCE(NULLIF(TRIM(rf.datos_especificos->>'causas'), ''), 'Sin dato') AS etiqueta,
                COUNT(*)::integer AS cantidad
             ${BASE_FROM} ${filtroExtra}
             GROUP BY 1
             HAVING COUNT(*) > 0
             ORDER BY cantidad DESC
             LIMIT 12`
        ),
        pool.query(
            `SELECT
                COALESCE(NULLIF(TRIM(rf.datos_especificos->>'estado_via'), ''), 'Sin dato') AS etiqueta,
                COUNT(*)::integer AS cantidad
             ${BASE_FROM} ${filtroExtra}
             GROUP BY 1
             HAVING COUNT(*) > 0
             ORDER BY cantidad DESC
             LIMIT 10`
        ),
        pool.query(
            `SELECT
                CASE
                    WHEN UPPER(TRIM(COALESCE(
                        NULLIF(rf.datos_especificos->>'soat', ''),
                        NULLIF(rf.datos_especificos->>'soat_si_no', ''),
                        ''
                    ))) IN ('SI', 'SÍ', 'S', 'YES') THEN 'SÍ'
                    WHEN UPPER(TRIM(COALESCE(
                        NULLIF(rf.datos_especificos->>'soat', ''),
                        NULLIF(rf.datos_especificos->>'soat_si_no', ''),
                        ''
                    ))) IN ('NO', 'N') THEN 'NO'
                    ELSE COALESCE(NULLIF(TRIM(COALESCE(
                        rf.datos_especificos->>'soat',
                        rf.datos_especificos->>'soat_si_no'
                    )), ''), 'Sin dato')
                END AS etiqueta,
                COUNT(*)::integer AS cantidad
             ${BASE_FROM} ${filtroExtra}
             GROUP BY 1
             HAVING COUNT(*) > 0
             ORDER BY cantidad DESC`
        ),
        pool.query(
            `SELECT
                COALESCE(NULLIF(TRIM(rf.datos_especificos->>'sexo'), ''), 'Sin dato') AS etiqueta,
                COUNT(*)::integer AS cantidad
             ${BASE_FROM} ${filtroExtra}
             GROUP BY 1
             HAVING COUNT(*) > 0
             ORDER BY cantidad DESC
             LIMIT 8`
        ),
        pool.query(
            `SELECT
                CASE
                    WHEN edad_num IS NULL THEN 'Sin dato'
                    WHEN edad_num < 18 THEN 'Menores de 18'
                    WHEN edad_num BETWEEN 18 AND 35 THEN '18-35'
                    WHEN edad_num BETWEEN 36 AND 50 THEN '36-50'
                    ELSE 'Mayores de 50'
                END AS etiqueta,
                COUNT(*)::integer AS cantidad
             FROM (
                SELECT
                    CASE
                        WHEN (rf.datos_especificos->>'edad') ~ '^[0-9]+$'
                        THEN CAST(rf.datos_especificos->>'edad' AS INTEGER)
                        ELSE NULL
                    END AS edad_num
                ${BASE_FROM} ${filtroExtra}
             ) sub
             GROUP BY 1
             HAVING COUNT(*) > 0`
        ),
        pool.query(
            `SELECT
                CASE
                    WHEN COALESCE(rf.total_muertos, 0) > 0 THEN 'Con Fallecidos'
                    WHEN COALESCE(rf.total_heridos, 0) > 0 THEN 'Con Heridos'
                    ELSE 'Solo Daños'
                END AS etiqueta,
                COUNT(*)::integer AS cantidad
             ${BASE_FROM} ${filtroExtra}
             GROUP BY 1
             HAVING COUNT(*) > 0`
        ),
    ]);

    const ORDEN_EDAD = { 'Menores de 18': 1, '18-35': 2, '36-50': 3, 'Mayores de 50': 4, 'Sin dato': 5 };
    const ORDEN_SEVERIDAD = { 'Solo Daños': 1, 'Con Heridos': 2, 'Con Fallecidos': 3 };

    const rangosEdad = [...rangosEdadRes.rows].sort(
        (a, b) => (ORDEN_EDAD[a.etiqueta] || 99) - (ORDEN_EDAD[b.etiqueta] || 99)
    );
    const severidad = [...severidadRes.rows].sort(
        (a, b) => (ORDEN_SEVERIDAD[a.etiqueta] || 99) - (ORDEN_SEVERIDAD[b.etiqueta] || 99)
    );

    return {
        clasificacion_hecho: clasificacionRes.rows,
        causas:              causasRes.rows,
        estado_via:          estadoViaRes.rows,
        soat:                soatRes.rows,
        sexo:                sexoRes.rows,
        rangos_edad:         rangosEdad,
        severidad,
    };
};

/**
 * GET /api/dashboard/estadisticas?tipo_formulario=todos|03A|FELCV-FEM|...
 * Solo registros con estado = 'validado'
 */
router.get('/estadisticas', async (req, res) => {
    try {
        const { clausula: filtroExtra, tipoGrafico, codigoExacto } = resolverFiltroSQL(req.query.tipo_formulario);
        const esTodos = !filtroExtra;

        const [kpisRes, porZonaRes, porFormularioRes, porMesRes] = await Promise.all([
            pool.query(
                `SELECT
                    COUNT(*)::integer AS total_registros,
                    COALESCE(SUM(rf.total_casos), 0)::integer AS total_casos,
                    COALESCE(SUM(rf.total_heridos), 0)::integer AS total_heridos,
                    COALESCE(SUM(rf.total_muertos), 0)::integer AS total_muertos
                 ${BASE_FROM} ${filtroExtra}`
            ),
            pool.query(
                `SELECT
                    COALESCE(NULLIF(TRIM(rf.zona), ''), 'Sin zona') AS zona,
                    COUNT(*)::integer AS cantidad
                 ${BASE_FROM} ${filtroExtra}
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
                 ${BASE_FROM} ${filtroExtra}
                 GROUP BY rf.formulario_codigo, fc.nombre, fc.categoria
                 ORDER BY cantidad DESC`
            ),
            pool.query(
                `SELECT
                    rf.mes_registro AS mes,
                    COUNT(*)::integer AS cantidad
                 ${BASE_FROM} ${filtroExtra}
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
        if (!esTodos) {
            graficoDinamico = await elegirGraficoDinamico(tipoGrafico, filtroExtra, codigoExacto);
        }

        let transito03a = null;
        if (esFormulario03A(codigoExacto)) {
            transito03a = await obtenerMetricasTransito03A(filtroExtra);
        }

        res.json({
            tipo_formulario: codigoExacto || tipoGrafico,
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
                transito_03a: transito03a,
            },
        });
    } catch (err) {
        console.error('Error en /dashboard/estadisticas:', err);
        res.status(500).json({ message: 'Error al obtener estadísticas del dashboard', detalle: err.message });
    }
});

module.exports = router;

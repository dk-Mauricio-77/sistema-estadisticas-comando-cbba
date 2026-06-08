// routes/formularios.js
// Guardar en: backend-policia-cocha/routes/formularios.js

const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// ── Middleware simple de autenticación JWT ──────────────────────────────────
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ message: 'Token requerido' });
    const token = auth.split(' ')[1];
    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// ── Helper: extraer campos comunes del body ─────────────────────────────────
const ESTADOS_VALIDOS = ['pendiente', 'validado', 'rechazado', 'observado'];

const extraerCamposComunes = (body) => ({
    unidad_policial:  body.unidad_policial  || null,
    fecha_registro:   body.fecha_registro   || new Date().toISOString().split('T')[0],
    gestion_anio:     body.gestion_anio     || new Date().getFullYear(),
    mes_registro:     body.mes_registro     || (new Date().getMonth() + 1),
    gps_latitud:      body.gps_latitud      || null,
    gps_longitud:     body.gps_longitud     || null,
    zona:             body.zona             || null,
    municipio:        body.municipio        || 'Cochabamba',
    departamento:     body.departamento     || 'Cochabamba',
    area:             body.area             || null,
    total_casos:      body.total_casos      || 1,
    total_heridos:    body.total_heridos    || 0,
    total_muertos:    body.total_muertos    || 0,
});

/** Resuelve código contra catálogo con búsqueda flexible (formularios genéricos) */
const resolverCodigoCatalogo = async (codigo, nombreFormulario = null) => {
    const codigoLimpio = String(codigo || '').trim();
    if (!codigoLimpio) return null;

    const exacto = await pool.query(
        'SELECT codigo FROM formularios_catalogo WHERE codigo = $1 AND activo = TRUE',
        [codigoLimpio]
    );
    if (exacto.rows.length) return exacto.rows[0].codigo;

    const ci = await pool.query(
        'SELECT codigo FROM formularios_catalogo WHERE UPPER(codigo) = UPPER($1) AND activo = TRUE',
        [codigoLimpio]
    );
    if (ci.rows.length) return ci.rows[0].codigo;

    const prefijo = await pool.query(
        `SELECT codigo FROM formularios_catalogo
         WHERE activo = TRUE AND (
           UPPER(codigo) LIKE UPPER($1) || '%'
           OR UPPER(codigo) LIKE '%' || UPPER($1) || '%'
         )
         ORDER BY LENGTH(codigo) ASC
         LIMIT 1`,
        [codigoLimpio]
    );
    if (prefijo.rows.length) return prefijo.rows[0].codigo;

    if (nombreFormulario) {
        const porNombre = await pool.query(
            `SELECT codigo FROM formularios_catalogo
             WHERE activo = TRUE AND UPPER(nombre) LIKE '%' || UPPER($1) || '%'
             ORDER BY LENGTH(nombre) ASC
             LIMIT 1`,
            [nombreFormulario]
        );
        if (porNombre.rows.length) return porNombre.rows[0].codigo;
    }

    const codigoFinal = codigoLimpio.substring(0, 30);
    const nombreFinal = nombreFormulario || `Formulario ${codigoFinal}`;
    await pool.query(
        `INSERT INTO formularios_catalogo (codigo, nombre, categoria, unidad_origen, activo)
         VALUES ($1, $2, 'generico', 'General', TRUE)
         ON CONFLICT (codigo) DO UPDATE SET activo = TRUE, nombre = EXCLUDED.nombre`,
        [codigoFinal, nombreFinal]
    );
    return codigoFinal;
};

// ============================================================
// GET /api/formularios/catalogo
// Lista todos los tipos de formulario activos
// ============================================================
router.get('/catalogo', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, codigo, nombre, categoria, unidad_origen
             FROM formularios_catalogo
             WHERE activo = TRUE
             ORDER BY categoria, nombre`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener catálogo:', err);
        res.status(500).json({ message: 'Error al obtener catálogo de formularios' });
    }
});

// ============================================================
// POST /api/formularios/registrar
// Guarda un formulario completado por el operador
// ============================================================
router.post('/registrar', verificarToken, async (req, res) => {
    const { formulario_codigo, datos_especificos, nombre_formulario, ...resto } = req.body;

    if (!formulario_codigo) {
        return res.status(400).json({ message: 'El código de formulario es requerido' });
    }
    if (!datos_especificos || typeof datos_especificos !== 'object') {
        return res.status(400).json({ message: 'Los datos específicos del formulario son requeridos' });
    }

    try {
        const codigoCatalogo = await resolverCodigoCatalogo(formulario_codigo, nombre_formulario);
        if (!codigoCatalogo) {
            return res.status(400).json({ message: 'Código de formulario inválido' });
        }

        const campos = extraerCamposComunes(resto);

        const result = await pool.query(
            `INSERT INTO registros_formularios (
                formulario_codigo, usuario_id,
                unidad_policial, fecha_registro, gestion_anio, mes_registro,
                gps_latitud, gps_longitud, zona, municipio, departamento, area,
                total_casos, total_heridos, total_muertos,
                estado, datos_especificos
            ) VALUES (
                $1, $2,
                $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12,
                $13, $14, $15,
                'pendiente', $16
            )
            RETURNING id, formulario_codigo, estado, created_at`,
            [
                codigoCatalogo,             req.usuario.id,
                campos.unidad_policial,     campos.fecha_registro,
                campos.gestion_anio,        campos.mes_registro,
                campos.gps_latitud,         campos.gps_longitud,
                campos.zona,                campos.municipio,
                campos.departamento,        campos.area,
                campos.total_casos,         campos.total_heridos,
                campos.total_muertos,       JSON.stringify(datos_especificos)
            ]
        );

        res.status(201).json({
            message: 'Formulario registrado correctamente. Pendiente de validación.',
            registro: result.rows[0]
        });

    } catch (err) {
        console.error('Error al registrar formulario:', err);
        res.status(500).json({ message: 'Error al guardar el formulario' });
    }
});

// ============================================================
// GET /api/formularios/mis-registros
// El operador ve sus propios registros (ej. ?estado=rechazado → bandeja Observados)
// ============================================================
router.get('/mis-registros', verificarToken, async (req, res) => {
    try {
        const { codigo, estado, limite = 50 } = req.query;

        if (estado && !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido', estados_permitidos: ESTADOS_VALIDOS });
        }

        let where = 'WHERE rf.usuario_id = $1';
        const params = [req.usuario.id];
        let idx = 2;

        if (codigo) { where += ` AND rf.formulario_codigo = $${idx++}`; params.push(codigo); }
        if (estado) { where += ` AND rf.estado = $${idx++}`; params.push(estado); }

        const result = await pool.query(
            `SELECT
                rf.id,
                rf.formulario_codigo,
                fc.nombre AS nombre_formulario,
                rf.unidad_policial,
                rf.fecha_registro,
                rf.gestion_anio,
                rf.mes_registro,
                rf.gps_latitud,
                rf.gps_longitud,
                rf.zona,
                rf.municipio,
                rf.departamento,
                rf.area,
                rf.total_casos,
                rf.total_heridos,
                rf.total_muertos,
                rf.estado,
                rf.observacion_rechazo AS motivo_rechazo,
                rf.datos_especificos,
                rf.fecha_validacion,
                rf.created_at,
                rf.updated_at
             FROM registros_formularios rf
             JOIN formularios_catalogo fc ON rf.formulario_codigo = fc.codigo
             ${where}
             ORDER BY rf.updated_at DESC NULLS LAST, rf.created_at DESC
             LIMIT $${idx}`,
            [...params, parseInt(limite, 10) || 50]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener registros:', err);
        res.status(500).json({ message: 'Error al obtener registros' });
    }
});

// ============================================================
// GET /api/formularios/pendientes
// El analista ve todos los formularios pendientes de validar
// ============================================================
router.get('/pendientes', verificarToken, async (req, res) => {
    if (!['analista', 'admin'].includes(req.usuario.rol)) {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const { estado, codigo } = req.query;

        // Estado por defecto: pendiente. Acepta cualquier estado válido.
        const estadoFiltro = ['pendiente','validado','rechazado','observado'].includes(estado)
            ? estado
            : 'pendiente';

        let query = `
            SELECT
                rf.id,
                rf.formulario_codigo,
                fc.nombre              AS nombre_formulario,
                fc.categoria,
                rf.fecha_registro,
                rf.gestion_anio,
                rf.unidad_policial,
                rf.zona,
                rf.municipio,
                rf.departamento,
                rf.gps_latitud,
                rf.gps_longitud,
                rf.total_casos,
                rf.total_heridos,
                rf.total_muertos,
                rf.estado,
                rf.observacion_rechazo,
                rf.datos_especificos,
                rf.created_at,
                u.nombre_completo      AS operador_nombre,
                u.nombre_completo      AS registrado_por,
                u.unidad               AS operador_unidad
            FROM registros_formularios rf
            JOIN formularios_catalogo  fc ON rf.formulario_codigo = fc.codigo
            JOIN usuarios              u  ON rf.usuario_id        = u.id
            WHERE rf.estado = $1
        `;
        const params = [estadoFiltro];

        if (codigo) {
            query += ` AND rf.formulario_codigo = $2`;
            params.push(codigo);
        }

        query += ` ORDER BY rf.created_at ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener registros de validacion:', err);
        res.status(500).json({ message: 'Error al obtener registros' });
    }
});

// ============================================================
// PATCH /api/formularios/:id/corregir
// Operador corrige un rechazado y lo reenvía a validación (estado → pendiente)
// ============================================================
router.patch('/:id/corregir', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { datos_especificos, ...resto } = req.body;

    if (!datos_especificos || typeof datos_especificos !== 'object') {
        return res.status(400).json({ message: 'Los datos específicos del formulario son requeridos' });
    }

    try {
        const existente = await pool.query(
            `SELECT id, usuario_id, estado, formulario_codigo
             FROM registros_formularios
             WHERE id = $1`,
            [id]
        );

        if (existente.rows.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        const registro = existente.rows[0];

        if (registro.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
            return res.status(403).json({ message: 'Solo el operador que registró el formulario puede corregirlo' });
        }

        if (registro.estado !== 'rechazado') {
            return res.status(400).json({
                message: 'Solo se pueden corregir formularios en estado rechazado',
                estado_actual: registro.estado,
            });
        }

        const campos = extraerCamposComunes(resto);

        const result = await pool.query(
            `UPDATE registros_formularios SET
                unidad_policial     = $1,
                fecha_registro      = $2,
                gestion_anio        = $3,
                mes_registro        = $4,
                gps_latitud         = $5,
                gps_longitud        = $6,
                zona                = $7,
                municipio           = $8,
                departamento        = $9,
                area                = $10,
                total_casos         = $11,
                total_heridos       = $12,
                total_muertos       = $13,
                datos_especificos   = $14,
                estado              = 'pendiente',
                observacion_rechazo = NULL,
                validado_por        = NULL,
                fecha_validacion    = NULL,
                updated_at          = NOW()
             WHERE id = $15
             RETURNING id, formulario_codigo, estado, observacion_rechazo, updated_at`,
            [
                campos.unidad_policial,
                campos.fecha_registro,
                campos.gestion_anio,
                campos.mes_registro,
                campos.gps_latitud,
                campos.gps_longitud,
                campos.zona,
                campos.municipio,
                campos.departamento,
                campos.area,
                campos.total_casos,
                campos.total_heridos,
                campos.total_muertos,
                JSON.stringify(datos_especificos),
                id,
            ]
        );

        res.json({
            message: 'Formulario corregido y reenviado a validación (pendiente)',
            registro: result.rows[0],
        });
    } catch (err) {
        console.error('Error al corregir formulario:', err);
        res.status(500).json({ message: 'Error al corregir el formulario' });
    }
});

// ============================================================
// PATCH /api/formularios/:id/validar
// El analista valida o rechaza un formulario
// ============================================================
router.patch('/:id/validar', verificarToken, async (req, res) => {
    if (!['analista', 'admin'].includes(req.usuario.rol)) {
        return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { id } = req.params;
    const { accion, observacion } = req.body; // accion: 'validar' | 'rechazar'

    if (!['validar', 'rechazar'].includes(accion)) {
        return res.status(400).json({ message: "Acción debe ser 'validar' o 'rechazar'" });
    }
    if (accion === 'rechazar' && !observacion) {
        return res.status(400).json({ message: 'Debe indicar el motivo del rechazo' });
    }

    try {
        const nuevoEstado = accion === 'validar' ? 'validado' : 'rechazado';

        const result = await pool.query(
            `UPDATE registros_formularios SET
                estado              = $1,
                observacion_rechazo = $2,
                validado_por        = $3,
                fecha_validacion    = NOW(),
                updated_at          = NOW()
             WHERE id = $4
             RETURNING id, estado, fecha_validacion`,
            [nuevoEstado, observacion || null, req.usuario.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        res.json({
            message: `Formulario ${nuevoEstado} correctamente`,
            registro: result.rows[0]
        });
    } catch (err) {
        console.error('Error al validar formulario:', err);
        res.status(500).json({ message: 'Error al procesar la validación' });
    }
});

// ============================================================
// GET /api/formularios/dashboard/:codigo
// KPIs y datos para el dashboard de un tipo de formulario
// ============================================================
router.get('/dashboard/:codigo', verificarToken, async (req, res) => {
    if (!['analista', 'admin'].includes(req.usuario.rol)) {
        return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { codigo } = req.params;
    const { anio = new Date().getFullYear() } = req.query;

    try {
        // KPIs generales
        const kpis = await pool.query(
            `SELECT
                COUNT(*)              AS total_registros,
                SUM(total_heridos)    AS total_heridos,
                SUM(total_muertos)    AS total_muertos,
                SUM(total_casos)      AS total_casos
             FROM registros_formularios
             WHERE formulario_codigo = $1
               AND gestion_anio = $2
               AND estado = 'validado'`,
            [codigo, anio]
        );

        // Distribución por zona
        const porZona = await pool.query(
            `SELECT zona, COUNT(*) AS cantidad
             FROM registros_formularios
             WHERE formulario_codigo = $1
               AND gestion_anio = $2
               AND estado = 'validado'
               AND zona IS NOT NULL
             GROUP BY zona ORDER BY cantidad DESC`,
            [codigo, anio]
        );

        // Tendencia mensual
        const porMes = await pool.query(
            `SELECT mes_registro AS mes, COUNT(*) AS cantidad
             FROM registros_formularios
             WHERE formulario_codigo = $1
               AND gestion_anio = $2
               AND estado = 'validado'
             GROUP BY mes_registro ORDER BY mes_registro`,
            [codigo, anio]
        );

        // Puntos para mapa de calor
        const mapaCalor = await pool.query(
            `SELECT gps_latitud AS lat, gps_longitud AS lng, total_casos AS intensidad
             FROM registros_formularios
             WHERE formulario_codigo = $1
               AND gestion_anio = $2
               AND estado = 'validado'
               AND gps_latitud IS NOT NULL`,
            [codigo, anio]
        );

        res.json({
            codigo,
            anio: parseInt(anio),
            kpis:      kpis.rows[0],
            por_zona:  porZona.rows,
            por_mes:   porMes.rows,
            mapa_calor: mapaCalor.rows
        });

    } catch (err) {
        console.error('Error al obtener dashboard:', err);
        res.status(500).json({ message: 'Error al generar dashboard' });
    }
});

// Conteo por estado para los KPIs del módulo de validación

router.get('/stats-validacion', verificarToken, async (req, res) => {
    if (!['analista', 'admin'].includes(req.usuario.rol)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
      const result = await pool.query(
        `SELECT estado, COUNT(*)::integer AS total
         FROM registros_formularios
         GROUP BY estado`
      );
      const stats = { pendiente: 0, validado: 0, rechazado: 0, observado: 0 };
      result.rows.forEach(r => { stats[r.estado] = r.total; });
      res.json(stats);
    } catch (err) {
      console.error('Error al obtener stats de validacion:', err);
      res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
  });

module.exports = router;
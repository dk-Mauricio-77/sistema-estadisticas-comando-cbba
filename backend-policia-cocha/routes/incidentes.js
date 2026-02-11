const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * POST /api/incidentes - Crear nuevo incidente con estructura híbrida
 * Recibe datos fijos y datos específicos en JSONB
 */
router.post('/', async (req, res) => {
    const client = await pool.connect();
    
    try {
        console.log('POST /api/incidentes - Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const {
            fecha_hora_hecho,
            latitud,
            longitud,
            usuario_id,
            unidad_policial,
            tipo_formulario,
            codigo_caso_principal,
            datos_especificos
        } = req.body;

        // Validación de campos requeridos
        if (!fecha_hora_hecho || !tipo_formulario) {
            console.error('Validación fallida - Campos requeridos faltantes:', {
                fecha_hora_hecho: !!fecha_hora_hecho,
                tipo_formulario: !!tipo_formulario
            });
            return res.status(400).json({ error: 'Faltan campos requeridos: fecha_hora_hecho y tipo_formulario son obligatorios' });
        }

        await client.query('BEGIN');
        console.log('Iniciando transacción de base de datos');
        
        const insertQuery = `
            INSERT INTO incidentes 
            (fecha_hora_hecho, latitud, longitud, usuario_id, unidad_policial, tipo_formulario, codigo_caso_principal, datos_especificos)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, fecha_hora_hecho, latitud, longitud, tipo_formulario, codigo_caso_principal, created_at
        `;
        
        console.log('Ejecutando INSERT en tabla incidentes con valores:', {
            fecha_hora_hecho,
            latitud: latitud || null,
            longitud: longitud || null,
            usuario_id: usuario_id || null,
            unidad_policial: unidad_policial || null,
            tipo_formulario,
            codigo_caso_principal: codigo_caso_principal || null,
            datos_especificos: datos_especificos || {}
        });
        
        const result = await client.query(insertQuery, [
            fecha_hora_hecho,
            latitud || null,
            longitud || null,
            usuario_id || null,
            unidad_policial || null,
            tipo_formulario,
            codigo_caso_principal || null,
            JSON.stringify(datos_especificos || {})
        ]);

        await client.query('COMMIT');
        console.log('Incidente registrado exitosamente. ID:', result.rows[0].id);
        
        res.status(201).json({
            mensaje: 'Incidente registrado exitosamente',
            incidente: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar incidente:');
        console.error('Tipo de error:', error.constructor.name);
        console.error('Mensaje:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('Código PostgreSQL:', error.code);
        console.error('Detalle:', error.detail);
        console.error('Tabla afectada:', error.table);
        res.status(500).json({ 
            error: 'Error al registrar el incidente', 
            detalle: error.message,
            codigo: error.code,
            tabla: error.table
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/incidentes - Obtener incidentes con filtros opcionales
 */
router.get('/', async (req, res) => {
    try {
        const { tipo_formulario, fecha_desde, fecha_hasta, codigo_caso } = req.query;
        
        let query = `
            SELECT 
                id,
                fecha_hora_hecho,
                latitud,
                longitud,
                usuario_id,
                unidad_policial,
                tipo_formulario,
                codigo_caso_principal,
                datos_especificos,
                created_at,
                updated_at
            FROM incidentes
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (tipo_formulario) {
            query += ` AND tipo_formulario = $${paramCount++}`;
            params.push(tipo_formulario);
        }
        
        if (fecha_desde) {
            query += ` AND DATE(fecha_hora_hecho) >= $${paramCount++}`;
            params.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            query += ` AND DATE(fecha_hora_hecho) <= $${paramCount++}`;
            params.push(fecha_hasta);
        }
        
        if (codigo_caso) {
            query += ` AND codigo_caso_principal ILIKE $${paramCount++}`;
            params.push(`%${codigo_caso}%`);
        }
        
        query += ` ORDER BY fecha_hora_hecho DESC LIMIT 100`;
        
        const result = await pool.query(query, params);
        console.log(`Consulta ejecutada exitosamente. Incidentes encontrados: ${result.rows.length}`);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener incidentes:', error);
        res.status(500).json({ 
            error: 'Error al obtener incidentes', 
            detalle: error.message 
        });
    }
});

/**
 * GET /api/incidentes/:id - Obtener un incidente por ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                id,
                fecha_hora_hecho,
                latitud,
                longitud,
                usuario_id,
                unidad_policial,
                tipo_formulario,
                codigo_caso_principal,
                datos_especificos,
                created_at,
                updated_at
            FROM incidentes
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Incidente no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener incidente:', error);
        res.status(500).json({ 
            error: 'Error al obtener el incidente', 
            detalle: error.message 
        });
    }
});

module.exports = router;

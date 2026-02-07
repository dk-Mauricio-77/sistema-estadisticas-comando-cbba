const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// POST /api/recepcion - Registrar nueva entrega de formulario
router.post('/', async (req, res) => {
    const client = await pool.connect();
    
    try {
        console.log('POST /api/recepcion - Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const { 
            entregado_por, 
            unidad_policial, 
            tipo_formulario, 
            fecha_hora_llegada,
            oficial_receptor_id,
            observaciones 
        } = req.body;

        // Validación de campos requeridos
        if (!entregado_por || !unidad_policial || !tipo_formulario) {
            console.error('Validación fallida - Campos requeridos faltantes:', {
                entregado_por: !!entregado_por,
                unidad_policial: !!unidad_policial,
                tipo_formulario: !!tipo_formulario
            });
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Establecer fecha_hora_llegada: usar la proporcionada o timestamp actual
        const fechaLlegada = fecha_hora_llegada || new Date().toISOString();

        await client.query('BEGIN');
        console.log('Iniciando transacción de base de datos');
        
        const insertQuery = `
            INSERT INTO entregas_formularios 
            (entregado_por, unidad_policial, tipo_formulario, fecha_hora_llegada, oficial_receptor_id, observaciones, estado)
            VALUES ($1, $2, $3, $4, $5, $6, 'recibido')
            RETURNING id, entregado_por, unidad_policial, tipo_formulario, fecha_hora_llegada, oficial_receptor_id, observaciones, estado, created_at
        `;
        
        console.log('Ejecutando INSERT en tabla entregas_formularios con valores:', {
            entregado_por,
            unidad_policial,
            tipo_formulario,
            fecha_hora_llegada: fechaLlegada,
            oficial_receptor_id: oficial_receptor_id || null,
            observaciones: observaciones || null
        });
        
        const result = await client.query(insertQuery, [
            entregado_por,
            unidad_policial,
            tipo_formulario,
            fechaLlegada,
            oficial_receptor_id || null,
            observaciones || null
        ]);

        await client.query('COMMIT');
        console.log('Entrega registrada exitosamente. ID:', result.rows[0].id);
        
        res.status(201).json({
            mensaje: 'Entrega registrada exitosamente',
            entrega: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar entrega de formulario:');
        console.error('Tipo de error:', error.constructor.name);
        console.error('Mensaje:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('Código PostgreSQL:', error.code);
        console.error('Detalle:', error.detail);
        console.error('Tabla afectada:', error.table);
        res.status(500).json({ 
            error: 'Error al registrar la entrega', 
            detalle: error.message,
            codigo: error.code,
            tabla: error.table
        });
    } finally {
        client.release();
    }
});

// GET /api/recepcion/recientes - Obtener entregas de hoy
router.get('/recientes', async (req, res) => {
    try {
        const query = `
            SELECT 
                e.id,
                e.entregado_por,
                e.unidad_policial,
                e.tipo_formulario,
                e.fecha_hora_llegada,
                e.observaciones,
                e.estado,
                e.created_at,
                u.nombre_completo as oficial_receptor
            FROM entregas_formularios e
            LEFT JOIN usuarios u ON e.oficial_receptor_id = u.id
            WHERE DATE(e.fecha_hora_llegada) = CURRENT_DATE
            ORDER BY e.fecha_hora_llegada DESC
        `;
        
        const result = await pool.query(query);
        console.log(`Consulta ejecutada exitosamente. Entregas encontradas: ${result.rows.length}`);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener entregas recientes:', error);
        res.status(500).json({ 
            error: 'Error al obtener entregas recientes', 
            detalle: error.message 
        });
    }
});

// GET /api/recepcion - Obtener todas las entregas (opcional, para reportes)
router.get('/', async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta, estado } = req.query;
        
        let query = `
            SELECT 
                e.id,
                e.entregado_por,
                e.unidad_policial,
                e.tipo_formulario,
                e.fecha_hora_llegada,
                e.observaciones,
                e.estado,
                e.created_at,
                u.nombre_completo as oficial_receptor
            FROM entregas_formularios e
            LEFT JOIN usuarios u ON e.oficial_receptor_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (fecha_desde) {
            query += ` AND DATE(e.fecha_hora_llegada) >= $${paramCount++}`;
            params.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            query += ` AND DATE(e.fecha_hora_llegada) <= $${paramCount++}`;
            params.push(fecha_hasta);
        }
        
        if (estado) {
            query += ` AND e.estado = $${paramCount++}`;
            params.push(estado);
        }
        
        query += ` ORDER BY e.fecha_hora_llegada DESC LIMIT 100`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener entregas:', error);
        res.status(500).json({ error: 'Error al obtener entregas', detalle: error.message });
    }
});

module.exports = router;

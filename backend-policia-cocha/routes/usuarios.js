const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const bcrypt = require('bcrypt');

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                nombre_completo,
                email,
                rol,
                unidad,
                estado,
                ultimo_acceso,
                created_at
            FROM usuarios
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios', detalle: error.message });
    }
});

// POST /api/usuarios - Crear nuevo usuario
router.post('/', async (req, res) => {
    const client = await pool.connect();
    
    try {
        // TODO: Implementar verificación de autenticación y autorización
        // Verificar que el usuario autenticado tenga rol 'admin' antes de permitir creación
        
        console.log('POST /api/usuarios - Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const { nombre_completo, email, password, rol, unidad } = req.body;

        // Validación de campos requeridos
        if (!nombre_completo || !email || !password || !rol) {
            console.error('Validación fallida - Campos requeridos faltantes:', {
                nombre_completo: !!nombre_completo,
                email: !!email,
                password: !!password,
                rol: !!rol
            });
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Verificar unicidad del email en la base de datos
        console.log('Verificando existencia del email en base de datos:', email);
        const emailCheck = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            console.error('Email ya registrado en el sistema:', email);
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Generar hash de contraseña usando bcrypt
        console.log('Generando hash de contraseña con bcrypt');
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        console.log('Hash de contraseña generado exitosamente');

        // Iniciar transacción para inserción de usuario
        await client.query('BEGIN');
        console.log('Iniciando transacción de base de datos');
        
        const insertQuery = `
            INSERT INTO usuarios (nombre_completo, email, password_hash, rol, unidad, estado)
            VALUES ($1, $2, $3, $4, $5, 'activo')
            RETURNING id, nombre_completo, email, rol, unidad, estado, created_at
        `;
        
        console.log('Ejecutando INSERT en tabla usuarios con valores:', {
            nombre_completo,
            email,
            password_hash: '***oculto***',
            rol,
            unidad: unidad || null
        });
        
        const result = await client.query(insertQuery, [
            nombre_completo,
            email,
            password_hash,
            rol,
            unidad || null
        ]);

        await client.query('COMMIT');
        console.log('Usuario creado exitosamente. ID:', result.rows[0].id);
        
        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear usuario en base de datos:');
        console.error('Tipo de error:', error.constructor.name);
        console.error('Mensaje:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('Código PostgreSQL:', error.code);
        console.error('Detalle:', error.detail);
        console.error('Tabla afectada:', error.table);
        console.error('Columna afectada:', error.column);
        console.error('Constraint violado:', error.constraint);
        res.status(500).json({ 
            error: 'Error al crear usuario', 
            detalle: error.message,
            codigo: error.code,
            tabla: error.table
        });
    } finally {
        client.release();
    }
});

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const { nombre_completo, email, password, rol, unidad, estado } = req.body;

        await client.query('BEGIN');

        // Construir query dinámicamente según los campos enviados
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nombre_completo) {
            updates.push(`nombre_completo = $${paramCount++}`);
            values.push(nombre_completo);
        }
        if (email) {
            // Verificar que el email no esté en uso por otro usuario
            const emailCheck = await client.query(
                'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
                [email, id]
            );
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (password) {
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(password_hash);
        }
        if (rol) {
            updates.push(`rol = $${paramCount++}`);
            values.push(rol);
        }
        if (unidad !== undefined) {
            updates.push(`unidad = $${paramCount++}`);
            values.push(unidad);
        }
        if (estado) {
            updates.push(`estado = $${paramCount++}`);
            values.push(estado);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        if (updates.length === 1) { // Solo updated_at
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        const updateQuery = `
            UPDATE usuarios
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, nombre_completo, email, rol, unidad, estado, ultimo_acceso, updated_at
        `;

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await client.query('COMMIT');
        
        res.json({
            mensaje: 'Usuario actualizado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario', detalle: error.message });
    } finally {
        client.release();
    }
});

// DELETE /api/usuarios/:id - Soft delete (cambiar estado a inactivo)
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const updateQuery = `
            UPDATE usuarios
            SET estado = 'inactivo', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, nombre_completo, email, estado
        `;

        const result = await client.query(updateQuery, [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await client.query('COMMIT');
        
        res.json({
            mensaje: 'Usuario desactivado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al desactivar usuario:', error);
        res.status(500).json({ error: 'Error al desactivar usuario', detalle: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;

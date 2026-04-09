const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

/**
 * POST /api/auth/login
 * Autenticación híbrida:
 * - Soporta contraseñas hasheadas con bcrypt (password_hash)
 * - Mantiene compatibilidad con contraseñas en texto plano (password o password_hash)
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario por email
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        const user = result.rows[0];

        // Si existe campo estado y no está activo, bloquear
        if (user.estado && user.estado !== 'activo') {
            return res.status(403).json({ message: 'El usuario se encuentra inactivo' });
        }

        // Detección inteligente de columna (password vs password_hash)
        const dbPassword = user.password_hash || user.password;

        // Comparación híbrida
        let isMatch = false;
        if (dbPassword && typeof dbPassword === 'string' && dbPassword.startsWith('$2b$')) {
            // Contraseña hasheada con bcrypt (usuarios nuevos)
            isMatch = await bcrypt.compare(password, dbPassword);
        } else {
            // Contraseña en texto plano (admin semilla legado)
            isMatch = password === dbPassword;
        }

        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        // Generar token JWT
        const payload = { id: user.id, rol: user.rol };
        const secret = process.env.JWT_SECRET || 'secret';

        const token = jwt.sign(payload, secret, { expiresIn: '8h' });

        // Opcional: actualizar ultimo_acceso
        try {
            await pool.query(
                'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );
        } catch (updateError) {
            console.error('Error al actualizar ultimo_acceso del usuario:', updateError);
        }

        return res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre_completo,
                rol: user.rol
            }
        });
    } catch (err) {
        console.error('Error en login de usuario:', err);
        return res.status(500).send('Server Error');
    }
});

module.exports = router;


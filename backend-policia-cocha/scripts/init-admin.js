// Script para inicializar el usuario admin
// Ejecutar con: node scripts/init-admin.js

require('dotenv').config();
const { pool } = require('../db');
const bcrypt = require('bcrypt');

async function initAdmin() {
    const client = await pool.connect();
    
    try {
        // Generar hash de la contraseña 'admin123'
        const password = 'admin123';
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        console.log('Hash generado para admin123:', password_hash);
        
        // Verificar si ya existe el usuario admin
        const checkQuery = await client.query(
            'SELECT id FROM usuarios WHERE email = $1',
            ['admin@policia.gov.bo']
        );
        
        if (checkQuery.rows.length > 0) {
            // Actualizar hash de contraseña si el usuario admin ya existe
            await client.query(
                'UPDATE usuarios SET password_hash = $1 WHERE email = $2',
                [password_hash, 'admin@policia.gov.bo']
            );
            console.log('Usuario admin actualizado con nuevo hash de contraseña');
        } else {
            // Insertar nuevo usuario administrador en la base de datos
            await client.query(
                `INSERT INTO usuarios (nombre_completo, email, password_hash, rol, unidad, estado)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    'Administrador del Sistema',
                    'admin@policia.gov.bo',
                    password_hash,
                    'admin',
                    'Administración',
                    'activo'
                ]
            );
            console.log('Usuario admin creado exitosamente en la base de datos');
        }
        
        console.log('Credenciales de acceso:');
        console.log('Email: admin@policia.gov.bo');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error al inicializar usuario administrador:', error);
    } finally {
        client.release();
        process.exit(0);
    }
}

initAdmin();

-- Script para crear la tabla usuarios
-- Ejecutar este script en pgAdmin o psql

-- Crear el tipo ENUM para roles (si no existe)
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('admin', 'analista', 'operador');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear la tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'operador',
    unidad VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

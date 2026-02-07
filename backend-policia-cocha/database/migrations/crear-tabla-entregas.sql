-- Script para crear la tabla entregas_formularios
-- Ejecutar este script en pgAdmin o psql

-- Crear la tabla entregas_formularios
CREATE TABLE IF NOT EXISTS entregas_formularios (
    id SERIAL PRIMARY KEY,
    entregado_por VARCHAR(255) NOT NULL,
    unidad_policial VARCHAR(255) NOT NULL,
    tipo_formulario VARCHAR(255) NOT NULL,
    fecha_hora_llegada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    oficial_receptor_id INTEGER REFERENCES usuarios(id),
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'recibido' CHECK (estado IN ('recibido', 'procesado', 'rechazado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_entregas_fecha ON entregas_formularios(fecha_hora_llegada);
CREATE INDEX IF NOT EXISTS idx_entregas_estado ON entregas_formularios(estado);

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'entregas_formularios' 
ORDER BY ordinal_position;

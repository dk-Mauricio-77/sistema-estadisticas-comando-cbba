-- Migración 003: Crear tabla incidentes con estructura híbrida (relacional + JSONB)
-- Ejecutar este script en pgAdmin o psql

-- Crear la tabla incidentes si no existe
CREATE TABLE IF NOT EXISTS incidentes (
    id SERIAL PRIMARY KEY,
    fecha_hora_hecho TIMESTAMP NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    usuario_id INTEGER REFERENCES usuarios(id),
    unidad_policial VARCHAR(255),
    tipo_formulario VARCHAR(255) NOT NULL,
    codigo_caso_principal VARCHAR(255),
    datos_especificos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_incidentes_fecha ON incidentes(fecha_hora_hecho);
CREATE INDEX IF NOT EXISTS idx_incidentes_tipo_formulario ON incidentes(tipo_formulario);
CREATE INDEX IF NOT EXISTS idx_incidentes_codigo_caso ON incidentes(codigo_caso_principal);
CREATE INDEX IF NOT EXISTS idx_incidentes_usuario ON incidentes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_unidad ON incidentes(unidad_policial);

-- Índice GIN para búsquedas rápidas en campos JSONB
CREATE INDEX IF NOT EXISTS idx_incidentes_datos_especificos_gin ON incidentes USING GIN (datos_especificos);

-- Índice compuesto para búsquedas por tipo y fecha
CREATE INDEX IF NOT EXISTS idx_incidentes_tipo_fecha ON incidentes(tipo_formulario, fecha_hora_hecho);

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incidentes' 
ORDER BY ordinal_position;

-- Verificar índices creados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'incidentes';

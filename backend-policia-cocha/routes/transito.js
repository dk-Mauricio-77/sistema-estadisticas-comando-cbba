
const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // Importamos la conexión desde server.js

// Endpoint: POST /api/formularios/transito
router.post('/', async (req, res) => {
    // 1. Obtenemos un cliente individual del pool para manejar la transacción
    const client = await pool.connect();

    try {
        // Extraemos los datos del JSON que envía el Frontend
        const { incidente, protagonista, estadisticas } = req.body;

        // --- INICIO DE LA TRANSACCIÓN ---
        await client.query('BEGIN');

        // 2. Insertar el INCIDENTE (Tabla Principal)
        const insertIncidenteQuery = `
            INSERT INTO incidentes_transito 
            (codigo_caso, fecha_hora, gps_latitud, gps_longitud, zona, tipo_hecho)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_incidente;
        `;
        const incidenteValues = [
            incidente.codigo_caso,
            incidente.fecha_hora,
            incidente.gps_latitud,
            incidente.gps_longitud,
            incidente.zona,
            incidente.tipo_hecho
        ];
        
        const resIncidente = await client.query(insertIncidenteQuery, incidenteValues);
        const nuevoIdIncidente = resIncidente.rows[0].id_incidente; // UUID generad

        // 3. Insertar el PROTAGONISTA (Tabla Hija 1) usando el UUID
        const insertProtagonistaQuery = `
            INSERT INTO protagonistas_vehiculos
            (incidente_id, conductor_nombre, placa_vehiculo, soat, grado_alcoholico, tipo_vehiculo)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        const protagonistaValues = [
            nuevoIdIncidente, // Usamos el ID del padre
            protagonista.conductor_nombre,
            protagonista.placa_vehiculo,
            protagonista.soat,
            protagonista.grado_alcoholico,
            protagonista.tipo_vehiculo
        ];
        await client.query(insertProtagonistaQuery, protagonistaValues);

        // 4. Insertar las ESTADÍSTICAS (Tabla Hija 2) usando el UUID
        const insertEstadisticaQuery = `
            INSERT INTO estadisticas_victimas
            (incidente_id, rango_edad, sexo, condicion, cantidad)
            VALUES ($1, $2, $3, $4, $5);
        `;
        const estadisticaValues = [
            nuevoIdIncidente, // Usamos el ID del padre
            estadisticas.rango_edad,
            estadisticas.sexo,
            estadisticas.condicion,
            estadisticas.cantidad
        ];
        await client.query(insertEstadisticaQuery, estadisticaValues);

        // --- SI TODO SALIÓ BIEN, GUARDAMOS CAMBIOS ---
        await client.query('COMMIT');
        
        res.status(201).json({ 
            mensaje: 'Formulario de Tránsito guardado exitosamente',
            id_incidente: nuevoIdIncidente
        });

    } catch (error) {
        // --- SI HUBO ERROR, DESHACEMOS TODO ---
        await client.query('ROLLBACK');
        console.error('Error en la transacción:', error);
        res.status(500).json({ error: 'Error al guardar el formulario', detalle: error.message });
    } finally {
        // Liberamos el cliente para que otros lo usen
        client.release();
    }
});

module.exports = router;
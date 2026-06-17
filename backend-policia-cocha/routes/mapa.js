const express = require('express');

const router  = express.Router();

const { pool } = require('../db');



/**

 * GET /api/analitica/mapa?estado=validado

 * Puntos GPS de registros validados para el mapa de calor.

 * Fuente: registros_formularios (estado = 'validado').

 * Ignora coordenadas nulas, cero, texto o fuera de Bolivia.

 */

router.get('/', async (req, res) => {

  try {

    const { estado = 'validado' } = req.query;



    const query = `

      SELECT

        rf.id,

        rf.gps_latitud  AS latitud,

        rf.gps_longitud AS longitud,

        rf.formulario_codigo AS tipo_formulario,

        rf.fecha_registro    AS fecha_hora_hecho,

        COALESCE(

          NULLIF(TRIM(rf.datos_especificos->>'zona_hecho'), ''),

          NULLIF(TRIM(rf.datos_especificos->>'zona_del_hecho'), ''),

          NULLIF(TRIM(rf.zona), ''),

          'Sin zona'

        ) AS zona,

        COALESCE(

          NULLIF(TRIM(rf.datos_especificos->>'clasificacion_hecho'), ''),

          NULLIF(TRIM(rf.datos_especificos->>'clasificacion_del_hecho'), ''),

          NULLIF(TRIM(rf.datos_especificos->>'sub_clasificacion_hechos'), ''),

          rf.formulario_codigo

        ) AS tipo_hecho

      FROM registros_formularios rf

      WHERE rf.estado = $1

        AND rf.gps_latitud  IS NOT NULL

        AND rf.gps_longitud IS NOT NULL

        AND TRIM(rf.gps_latitud::text)  <> ''

        AND TRIM(rf.gps_longitud::text) <> ''

        AND rf.gps_latitud::text  ~ '^-?[0-9]+(\\.[0-9]+)?$'

        AND rf.gps_longitud::text ~ '^-?[0-9]+(\\.[0-9]+)?$'

        AND rf.gps_latitud::numeric  <> 0

        AND rf.gps_longitud::numeric <> 0

        AND rf.gps_latitud::numeric  BETWEEN -23 AND -9

        AND rf.gps_longitud::numeric BETWEEN -70 AND -57

      ORDER BY rf.fecha_registro DESC NULLS LAST, rf.created_at DESC

    `;



    const result = await pool.query(query, [estado]);



    const puntosFormateados = result.rows.map(row => ({

      id:           row.id,

      gps_latitud:  parseFloat(row.latitud),

      gps_longitud: parseFloat(row.longitud),

      tipo_hecho:   row.tipo_hecho || row.tipo_formulario || 'Sin clasificar',

      zona:         row.zona       || 'Sin zona',

      fecha_hora:   row.fecha_hora_hecho,

    }));



    res.json(puntosFormateados);

  } catch (error) {

    console.error('Error en GET /mapa:', error);

    res.status(500).json({

      error:   'Error al obtener puntos del mapa',

      detalle: error.message,

    });

  }

});



module.exports = router;


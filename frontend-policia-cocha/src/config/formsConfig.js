/**
 * Configuración maestra de formularios dinámicos
 * Define la estructura, campos y validaciones para cada tipo de formulario
 */

export const formsConfig = {
  transito_03a: {
    id: 'transito_03a',
    nombre: 'Hechos de Tránsito',
    codigo: 'FORM. 03A',
    descripcion: 'Registro detallado de accidentes de tránsito',
    secciones: [
      {
        id: 'identificacion_ubicacion',
        titulo: 'Identificación y Ubicación',
        campos: [
          {
            id: 'cod_filtro',
            tipo: 'text',
            label: 'COD. FILTRO',
            placeholder: 'COD. FILTRO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'n_caso',
            tipo: 'text',
            label: 'N° CASO',
            placeholder: 'N° CASO',
            requerido: true,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'gestion',
            tipo: 'number',
            label: 'GESTION (Año)',
            placeholder: 'Año',
            requerido: true,
            min: 2000,
            max: 2100,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'mes_registro',
            tipo: 'select',
            label: 'MES DE REGISTRO',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar mes' },
              { value: '01', label: 'Enero' },
              { value: '02', label: 'Febrero' },
              { value: '03', label: 'Marzo' },
              { value: '04', label: 'Abril' },
              { value: '05', label: 'Mayo' },
              { value: '06', label: 'Junio' },
              { value: '07', label: 'Julio' },
              { value: '08', label: 'Agosto' },
              { value: '09', label: 'Septiembre' },
              { value: '10', label: 'Octubre' },
              { value: '11', label: 'Noviembre' },
              { value: '12', label: 'Diciembre' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'fecha_hecho',
            tipo: 'date',
            label: 'FECHA DEL HECHO',
            requerido: true,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'hora_hecho',
            tipo: 'time',
            label: 'HORA DEL HECHO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'departamento',
            tipo: 'text',
            label: 'DEPARTAMENTO',
            placeholder: 'DEPARTAMENTO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'provincia',
            tipo: 'text',
            label: 'PROVINCIA',
            placeholder: 'PROVINCIA',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'municipios',
            tipo: 'text',
            label: 'MUNICIPIOS',
            placeholder: 'MUNICIPIOS',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'comunidad_localidad',
            tipo: 'text',
            label: 'COMUNIDAD / LOCALIDAD',
            placeholder: 'COMUNIDAD / LOCALIDAD',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'zona_hecho',
            tipo: 'text',
            label: 'ZONA DEL HECHO',
            placeholder: 'ZONA DEL HECHO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'avenida_calle',
            tipo: 'text',
            label: 'AVENIDA/CALLE DEL HECHO',
            placeholder: 'AVENIDA/CALLE DEL HECHO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'tramo_carretero',
            tipo: 'text',
            label: 'TRAMO CARRETERO',
            placeholder: 'TRAMO CARRETERO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'categorizacion_carreteras',
            tipo: 'text',
            label: 'CATEGORIZACION DE CARRETERAS',
            placeholder: 'CATEGORIZACION DE CARRETERAS',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'gps_latitud_longitud',
            tipo: 'map_picker',
            label: 'GPS LATITUD - LONGITUD',
            requerido: true,
            gridCols: 'md:grid-cols-1',
            descripcion: 'Seleccione las coordenadas en el mapa'
          },
          {
            id: 'area',
            tipo: 'select',
            label: 'AREA (RURAL O URBANO)',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar área' },
              { value: 'RURAL', label: 'Rural' },
              { value: 'URBANO', label: 'Urbano' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'unidad_transito_registra',
            tipo: 'text',
            label: 'UNIDAD DE TRANSITO QUE REGISTRA EL CASO',
            placeholder: 'UNIDAD DE TRANSITO QUE REGISTRA EL CASO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          }
        ]
      },
      {
        id: 'detalles_hecho',
        titulo: 'Detalles del Hecho',
        campos: [
          {
            id: 'tipo_denuncia',
            tipo: 'select',
            label: 'TIPO DE DENUNCIA',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar tipo' },
              { value: 'ESCRITO', label: 'Escrito' },
              { value: 'VERBAL', label: 'Verbal' },
              { value: 'OFICIO', label: 'Oficio' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'sub_clasificacion_hechos',
            tipo: 'select',
            label: 'SUB CLASIFICACION DE HECHOS DE TRANSITO',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar clasificación' },
              { value: 'COLISION', label: 'Colisión' },
              { value: 'ATROPELLO', label: 'Atropello' },
              { value: 'VOLCAMIENTO', label: 'Volcamiento' },
              { value: 'CHOQUE', label: 'Choque' },
              { value: 'OTRO', label: 'Otro' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'clasificacion_hecho',
            tipo: 'select',
            label: 'CLASIFICACION DEL HECHO DE TRANSITO',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar clasificación' },
              { value: 'ACCIDENTE', label: 'Accidente' },
              { value: 'INCIDENTE', label: 'Incidente' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'causas',
            tipo: 'text',
            label: 'CAUSAS',
            placeholder: 'CAUSAS',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'clasificacion_via',
            tipo: 'text',
            label: 'CLASIFICACION DE LA VIA',
            placeholder: 'CLASIFICACION DE LA VIA',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'estado_via',
            tipo: 'select',
            label: 'ESTADO DE LA VIA',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar estado' },
              { value: 'BUENO', label: 'Bueno' },
              { value: 'REGULAR', label: 'Regular' },
              { value: 'MALO', label: 'Malo' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'division',
            tipo: 'text',
            label: 'DIVISION (ACCIDENTES Y ESPECIALES)',
            placeholder: 'DIVISION',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'investigador_asignado',
            tipo: 'text',
            label: 'INVESTIGADOR ASIGNADO (Nombre y Celular)',
            placeholder: 'Nombre y Celular',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'sancion',
            tipo: 'text',
            label: 'SANCION',
            placeholder: 'SANCION',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'n_resolucion_sancion',
            tipo: 'text',
            label: 'Nº DE RESOLUCION DE LA SANCION',
            placeholder: 'Nº DE RESOLUCION',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'medidas_cautelares',
            tipo: 'text',
            label: 'MEDIDAS CAUTELARES',
            placeholder: 'MEDIDAS CAUTELARES',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'estado_caso',
            tipo: 'select',
            label: 'ESTADO DEL CASO',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar estado' },
              { value: 'PENDIENTE', label: 'Pendiente' },
              { value: 'EN_INVESTIGACION', label: 'En Investigación' },
              { value: 'RESUELTO', label: 'Resuelto' },
              { value: 'ARCHIVADO', label: 'Archivado' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'remision_caso',
            tipo: 'text',
            label: 'REMISION DEL CASO',
            placeholder: 'REMISION DEL CASO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          }
        ]
      },
      {
        id: 'protagonistas_vehiculo',
        titulo: 'Protagonistas y Vehículo',
        campos: [
          {
            id: 'nombre_conductor_protagonista',
            tipo: 'text',
            label: 'NOMBRE DEL CONDUCTOR PROTAGONISTA',
            placeholder: 'NOMBRE DEL CONDUCTOR',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'sexo',
            tipo: 'select',
            label: 'SEXO',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar sexo' },
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'nacionalidad',
            tipo: 'text',
            label: 'NACIONALIDAD',
            placeholder: 'NACIONALIDAD',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'edad',
            tipo: 'number',
            label: 'EDAD',
            placeholder: 'EDAD',
            requerido: false,
            min: 0,
            max: 120,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'numero_licencia',
            tipo: 'text',
            label: 'NUMERO DE LICENCIA',
            placeholder: 'NUMERO DE LICENCIA',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'categoria_licencia',
            tipo: 'text',
            label: 'CATEGORIA DE LICENCIA',
            placeholder: 'CATEGORIA DE LICENCIA',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'grado_alcoholico',
            tipo: 'number',
            label: 'GRADO ALCOHOLICO',
            placeholder: '0.00',
            requerido: false,
            min: 0,
            max: 5,
            step: 0.01,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'temperancia',
            tipo: 'select',
            label: 'TEMPERANCIA',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar' },
              { value: 'SI', label: 'Sí' },
              { value: 'NO', label: 'No' }
            ],
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'situacion_juridica_sindicado',
            tipo: 'text',
            label: 'SITUACION JURICA DEL SINDICADO',
            placeholder: 'SITUACION JURICA',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'tipo_vehiculo_protagonista',
            tipo: 'text',
            label: 'TIPO DE VEHICULO PROTAGONISTA',
            placeholder: 'TIPO DE VEHICULO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'placa',
            tipo: 'text',
            label: 'PLACA',
            placeholder: 'PLACA',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'empresa_sindicato_institucion',
            tipo: 'text',
            label: 'EMPRESA, SINDICATO O INSTITUCION',
            placeholder: 'EMPRESA, SINDICATO O INSTITUCION',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'tipo_servicio_presta',
            tipo: 'text',
            label: 'TIPO DE SERVICIO QUE PRESTA',
            placeholder: 'TIPO DE SERVICIO',
            requerido: false,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'soat',
            tipo: 'select',
            label: 'SOAT',
            requerido: false,
            opciones: [
              { value: '', label: 'Seleccionar' },
              { value: 'SI', label: 'Sí' },
              { value: 'NO', label: 'No' }
            ],
            gridCols: 'md:grid-cols-2'
          }
        ]
      },
      {
        id: 'estadisticas',
        titulo: 'Estadísticas de Víctimas',
        campos: [
          {
            id: 'total_heridos',
            tipo: 'number',
            label: 'TOTAL HERIDOS',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'total_muertos',
            tipo: 'number',
            label: 'TOTAL MUERTOS',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-2'
          },
          {
            id: 'heridos_varon_0_12',
            tipo: 'number',
            label: 'Heridos Varón 0 a 12 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_mujer_0_12',
            tipo: 'number',
            label: 'Heridos Mujer 0 a 12 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_varon_13_17',
            tipo: 'number',
            label: 'Heridos Varón 13 a 17 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_mujer_13_17',
            tipo: 'number',
            label: 'Heridos Mujer 13 a 17 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_varon_18_30',
            tipo: 'number',
            label: 'Heridos Varón 18 a 30 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_mujer_18_30',
            tipo: 'number',
            label: 'Heridos Mujer 18 a 30 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_varon_31_45',
            tipo: 'number',
            label: 'Heridos Varón 31 a 45 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_mujer_31_45',
            tipo: 'number',
            label: 'Heridos Mujer 31 a 45 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_varon_46_59',
            tipo: 'number',
            label: 'Heridos Varón 46 a 59 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_mujer_46_59',
            tipo: 'number',
            label: 'Heridos Mujer 46 a 59 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_varon_60_plus',
            tipo: 'number',
            label: 'Heridos Varón 60+ años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'heridos_mujer_60_plus',
            tipo: 'number',
            label: 'Heridos Mujer 60+ años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_varon_0_12',
            tipo: 'number',
            label: 'Muertos Varón 0 a 12 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_mujer_0_12',
            tipo: 'number',
            label: 'Muertos Mujer 0 a 12 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_varon_13_17',
            tipo: 'number',
            label: 'Muertos Varón 13 a 17 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_mujer_13_17',
            tipo: 'number',
            label: 'Muertos Mujer 13 a 17 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_varon_18_30',
            tipo: 'number',
            label: 'Muertos Varón 18 a 30 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_mujer_18_30',
            tipo: 'number',
            label: 'Muertos Mujer 18 a 30 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_varon_31_45',
            tipo: 'number',
            label: 'Muertos Varón 31 a 45 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_mujer_31_45',
            tipo: 'number',
            label: 'Muertos Mujer 31 a 45 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_varon_46_59',
            tipo: 'number',
            label: 'Muertos Varón 46 a 59 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_mujer_46_59',
            tipo: 'number',
            label: 'Muertos Mujer 46 a 59 años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_varon_60_plus',
            tipo: 'number',
            label: 'Muertos Varón 60+ años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'muertos_mujer_60_plus',
            tipo: 'number',
            label: 'Muertos Mujer 60+ años',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_muertos_pasajeros',
            tipo: 'number',
            label: 'Víctimas Muertos - Pasajeros',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_heridos_pasajeros',
            tipo: 'number',
            label: 'Víctimas Heridos - Pasajeros',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_muertos_peatones',
            tipo: 'number',
            label: 'Víctimas Muertos - Peatones',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_heridos_peatones',
            tipo: 'number',
            label: 'Víctimas Heridos - Peatones',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_muertos_conductores',
            tipo: 'number',
            label: 'Víctimas Muertos - Conductores',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_heridos_conductores',
            tipo: 'number',
            label: 'Víctimas Heridos - Conductores',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_muertos_motociclistas',
            tipo: 'number',
            label: 'Víctimas Muertos - Motociclistas',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_heridos_motociclistas',
            tipo: 'number',
            label: 'Víctimas Heridos - Motociclistas',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_muertos_ciclistas',
            tipo: 'number',
            label: 'Víctimas Muertos - Ciclistas',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_heridos_ciclistas',
            tipo: 'number',
            label: 'Víctimas Heridos - Ciclistas',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_muertos_auxiliares',
            tipo: 'number',
            label: 'Víctimas Muertos - Auxiliares',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          },
          {
            id: 'victimas_heridos_auxiliares',
            tipo: 'number',
            label: 'Víctimas Heridos - Auxiliares',
            placeholder: '0',
            requerido: false,
            min: 0,
            gridCols: 'md:grid-cols-3'
          }
        ]
      },
      {
        id: 'narrativa_otros',
        titulo: 'Narrativa y Otros',
        campos: [
          {
            id: 'nombres_afectados',
            tipo: 'textarea',
            label: 'TODOS LOS NOMBRES DE LOS AFECTADOS',
            placeholder: 'Lista de nombres de los afectados',
            requerido: false,
            rows: 4,
            gridCols: 'md:grid-cols-1'
          },
          {
            id: 'nombres_nosocomio',
            tipo: 'textarea',
            label: 'NOMBRES DE LOS NOSOCOMIO (Hospitales)',
            placeholder: 'Lista de hospitales o nosocomios',
            requerido: false,
            rows: 3,
            gridCols: 'md:grid-cols-1'
          },
          {
            id: 'otros_datos_vehiculos_conductores',
            tipo: 'textarea',
            label: 'OTROS DATOS (Vehículos/Conductores Damnificados)',
            placeholder: 'Información adicional sobre vehículos y conductores',
            requerido: false,
            rows: 4,
            gridCols: 'md:grid-cols-1'
          },
          {
            id: 'breve_detalle_hecho',
            tipo: 'textarea',
            label: 'BREVE DETALLE DEL HECHO',
            placeholder: 'Descripción detallada del hecho de tránsito',
            requerido: false,
            rows: 6,
            gridCols: 'md:grid-cols-1'
          }
        ]
      }
    ]
  },
  mercados_01: {
    id: 'mercados_01',
    nombre: 'Control de Mercados y Ferias',
    codigo: '01',
    descripcion: 'Registro de operaciones policiales en mercados y ferias',
    secciones: []
  },
  infracciones_03b: {
    id: 'infracciones_03b',
    nombre: 'Infracciones de Tránsito',
    codigo: '03B',
    descripcion: 'Registro de infracciones y multas de tránsito',
    secciones: []
  },
  diprove_04a: {
    id: 'diprove_04a',
    nombre: 'Diprove: Casos',
    codigo: '04A',
    descripcion: 'Registro de casos de vehículos robados y autopartes',
    secciones: []
  },
  diprove_04b: {
    id: 'diprove_04b',
    nombre: 'Diprove: Vehículos Recuperados',
    codigo: '04B',
    descripcion: 'Registro de vehículos recuperados',
    secciones: []
  },
  diprove_04c: {
    id: 'diprove_04c',
    nombre: 'Diprove: Aprehendidos',
    codigo: '04C',
    descripcion: 'Registro de aprehendidos relacionados con vehículos',
    secciones: []
  },
  bomberos_05a: {
    id: 'bomberos_05a',
    nombre: 'Bomberiles',
    codigo: '05A',
    descripcion: 'Registro de incidentes bomberiles',
    secciones: []
  },
  auxilios_05b: {
    id: 'auxilios_05b',
    nombre: 'Auxilios',
    codigo: '05B',
    descripcion: 'Registro de auxilios prestados',
    secciones: []
  },
  interpol_06a: {
    id: 'interpol_06a',
    nombre: 'Interpol',
    codigo: '06A',
    descripcion: 'Control migratorio y operaciones INTERPOL en fronteras y puntos de control',
    secciones: []
  },
  upcom_06b: {
    id: 'upcom_06b',
    nombre: 'UPCOM',
    codigo: '06B',
    descripcion: 'Registro de operaciones UPCOM',
    secciones: []
  },
  antecedentes_06c: {
    id: 'antecedentes_06c',
    nombre: 'Antecedentes Interpol',
    codigo: '06C',
    descripcion: 'Registro de antecedentes Interpol',
    secciones: []
  },
  turistica_07a: {
    id: 'turistica_07a',
    nombre: 'Policía Turística',
    codigo: '07A',
    descripcion: 'Registro de operaciones de policía turística',
    secciones: []
  },
  pofoma_07: {
    id: 'pofoma_07',
    nombre: 'POFOMA',
    codigo: '07',
    descripcion: 'Registro de operaciones POFOMA',
    secciones: []
  },
  faltas_08a: {
    id: 'faltas_08a',
    nombre: 'Faltas y Contravenciones',
    codigo: '08A',
    descripcion: 'Registro de faltas y contravenciones',
    secciones: []
  },
  conflictos_08b: {
    id: 'conflictos_08b',
    nombre: 'Conflictos y Disturbios Sociales',
    codigo: '08B',
    descripcion: 'Registro de conflictos y disturbios sociales',
    secciones: []
  },
  arrestos_08c: {
    id: 'arrestos_08c',
    nombre: 'Arrestos (Faltas y Contravenciones)',
    codigo: '08C',
    descripcion: 'Registro de arrestos por faltas y contravenciones',
    secciones: []
  },
  canes_08d: {
    id: 'canes_08d',
    nombre: 'Actividades Canes',
    codigo: '08D',
    descripcion: 'Registro de actividades canes',
    secciones: []
  },
  gacip_08e: {
    id: 'gacip_08e',
    nombre: 'GACIP Casos Solidarios',
    codigo: '08E',
    descripcion: 'Registro de casos solidarios GACIP',
    secciones: []
  },
  gacip_capacitaciones_08f: {
    id: 'gacip_capacitaciones_08f',
    nombre: 'GACIP Capacitaciones Psicológicas',
    codigo: '08F',
    descripcion: 'Registro de capacitaciones psicológicas GACIP',
    secciones: []
  },
  aereo_09a: {
    id: 'aereo_09a',
    nombre: 'Aéreo Policial Casos Aeropuertos',
    codigo: '09A',
    descripcion: 'Registro de casos de aéreo policial en aeropuertos',
    secciones: []
  },
  aereo_casos_09b: {
    id: 'aereo_casos_09b',
    nombre: 'Casos Atendidos por Aéreo Policial',
    codigo: '09B',
    descripcion: 'Registro de casos atendidos por aéreo policial',
    secciones: []
  },
  extraordinario_09c: {
    id: 'extraordinario_09c',
    nombre: 'Servicios Extraordinarios',
    codigo: '09C',
    descripcion: 'Registro de servicios extraordinarios',
    secciones: []
  },
  hidrocarburos_10: {
    id: 'hidrocarburos_10',
    nombre: 'Control Hidrocarburos',
    codigo: '10',
    descripcion: 'Registro de control de hidrocarburos',
    secciones: []
  },
  extranjeros_11: {
    id: 'extranjeros_11',
    nombre: 'Control de Ciudadanos Extranjeros',
    codigo: '11',
    descripcion: 'Registro de control de ciudadanos extranjeros',
    secciones: []
  },
  transnacionales_12: {
    id: 'transnacionales_12',
    nombre: 'Delitos Transnacionales',
    codigo: '12',
    descripcion: 'Registro de delitos transnacionales',
    secciones: []
  },
  repe_13: {
    id: 'repe_13',
    nombre: 'REPE Consolidado',
    codigo: '13',
    descripcion: 'Registro REPE consolidado',
    secciones: []
  },
  memo_104: {
    id: 'memo_104',
    nombre: 'Memo 104 Control Cuidadanos Extranjeros',
    codigo: '15',
    descripcion: 'Registro según Memo 104 - Control de ciudadanos extranjeros',
    secciones: []
  },
  anh_hidrocarburos: {
    id: 'anh_hidrocarburos',
    nombre: 'ANH Hidrocarburos',
    codigo: 'ANH',
    descripcion: 'Registro ANH Hidrocarburos',
    secciones: []
  },
  epi_sur: {
    id: 'epi_sur',
    nombre: 'EPI Nº1 SurPor una Bolivia Mejor',
    codigo: 'EPI',
    descripcion: 'Registro EPI Nº1 Sur - Por una Bolivia Mejor',
    secciones: []
  },
  reg_vehicular: {
    id: 'reg_vehicular',
    nombre: 'Registro Vehicular',
    codigo: 'REG',
    descripcion: 'Registro vehicular',
    secciones: []
  },
  form_decs: {
    id: 'form_decs',
    nombre: 'Formulario DECs',
    codigo: 'DECS',
    descripcion: 'Formulario DECs',
    secciones: []
  },
  brigadas: {
    id: 'brigadas',
    nombre: 'Formulario Brigadas',
    codigo: 'BRIG',
    descripcion: 'Formulario de brigadas',
    secciones: []
  },
  control_migratorio: {
    id: 'control_migratorio',
    nombre: 'Fortalecimiento Control Migratorio InterpolCbba',
    codigo: 'INTERPOL',
    descripcion: 'Fortalecimiento del control migratorio INTERPOL Cochabamba',
    secciones: []
  },
  motochorros: {
    id: 'motochorros',
    nombre: 'Motochorros DECs',
    codigo: 'MOTO',
    descripcion: 'Registro de motochorros DECs',
    secciones: []
  },
  bolivia_mejor: {
    id: 'bolivia_mejor',
    nombre: 'Plan Por una Bolivia Mejor',
    codigo: 'BOL',
    descripcion: 'Plan Por una Bolivia Mejor',
    secciones: []
  },
  control_combustible: {
    id: 'control_combustible',
    nombre: 'Control_Combustible',
    codigo: 'COMB',
    descripcion: 'Control de combustible',
    secciones: []
  },
  mercados_ferias: {
    id: 'mercados_ferias',
    nombre: 'Mercados Ferias',
    codigo: 'MER',
    descripcion: 'Registro de mercados y ferias',
    secciones: []
  }
};

/**
 * Obtiene la configuración de un formulario por su ID
 * @param {string} formId - ID del formulario
 * @returns {Object|null} Configuración del formulario o null si no existe
 */
export const getFormConfig = (formId) => {
  return formsConfig[formId] || null;
};

/**
 * Obtiene todos los formularios disponibles
 * @returns {Array} Lista de formularios con id, nombre y descripción
 */
export const getAllForms = () => {
  return Object.values(formsConfig).map(form => ({
    id: form.id,
    nombre: form.nombre,
    codigo: form.codigo,
    descripcion: form.descripcion
  }));
};

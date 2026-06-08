# Arquitectura y Reglas de Negocio: Sistema Estadístico Comando Departamental
**Despliegue:** 100% On-Premise (Local). Node.js, Express, React, PostgreSQL + PostGIS.

## 1. Roles y Unidades Policiales
Los usuarios están estrictamente vinculados a una `Unidad_Policial` (FELCV, FELCC, DIPROVE, Tránsito, etc.).
*   **Guardia / Recepción:** Solo registra la llegada del formulario físico (quién lo trajo, qué tipo es, hora).
*   **Operador (Transcriptor):** Toma el formulario físico y transcribe todos los campos al sistema. Solo ve los tipos de formularios de su Unidad. 
*   **Analista (Validador):** Revisa los datos transcritos, aprueba para estadísticas o rechaza por errores.
*   **Super Admin:** Acceso total a configuraciones y usuarios.

## 2. Máquina de Estados del Formulario (El Bucle de Validación)
Todo registro en la tabla de incidentes tiene un `estado_validacion`:
1.  **Pendiente:** Estado inicial al ser transcrito y enviado por el Operador. Aparece en la bandeja del Analista.
2.  **Validado:** El Analista lo aprueba. Pasa a alimentar el Dashboard y los Mapas de Calor. Desaparece de validación.
3.  **Rechazado:** El Analista detecta un error (ej. coordenadas fallidas). 
    *   *Regla Estricta:* El registro NO se elimina. Cambia a estado `Rechazado` y se le adjunta un `motivo_rechazo`.
    *   Vuelve a la bandeja del Operador (pestaña "Observados"). Al abrirlo, carga toda la data previamente llenada para que el Operador solo corrija el error y lo reenvíe (vuelve a `Pendiente`).

## 3. Lógica del Dashboard Dinámico
No se mezclan peras con manzanas. El Dashboard tiene un Filtro Maestro ("Seleccionar Unidad / Tipo de Formulario").
*   Al seleccionar un tipo (ej. FELCV), el dashboard se renderiza dinámicamente mostrando gráficos específicos (Pie chart de Parentesco, Barras de Ocupación del agresor).
*   Al cambiar (ej. DIPROVE), las consultas SQL cambian para traer Marcas, Colores y Modelos de vehículos.

## 4. Exportación Oficial (Reportes PDF)
No se usa la impresión nativa del navegador. 
*   Se utiliza una plantilla "en la sombra" (invisible en la UI) formateada en tamaño carta (A4), con escudo de la Policía Boliviana, fecha, hora y usuario.
*   *Regla Estricta:* La exportación debe tener un *delay* (retraso) programado para permitir que las "baldosas" del mapa de Leaflet carguen completamente antes de capturar el canvas con `html2canvas` o `react-to-print`.

## 5. El Bug Inmediato a Resolver (Prioridad 1)
Actualmente, las peticiones POST desde `Carga de Datos` y `Recepción` arrojan `net::ERR_CONNECTION_REFUSED` hacia `http://localhost:3000`. Hay un problema de desincronización entre la URL base del frontend y el puerto `.env` del backend.
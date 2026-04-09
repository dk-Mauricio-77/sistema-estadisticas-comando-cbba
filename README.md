# Sistema para el Manejo y Control Estadísticas 


## Requisitos

- Node.js v18 o superior instalado
- PostgreSQL 14+ con la extensión PostGIS activada 

## Configuración de la Base de Datos
1. Crea una base de datos en PostgreSQL
2. Ejecuta el script SQL ubicado en la carpeta `database/schema.sql` para crear las tablas necesarias y el usuario administrador de prueba

## Levantando el Backend
1. Abre una terminal en la carpeta `backend-policia-cocha`
2. Ejecuta `npm install` para instalar las dependencias
3. Copia el archivo `.env.example`, pégalo en la misma carpeta y renómbralo a `.env`
4. Abre el nuevo archivo `.env` y coloca tus credenciales locales de PostgreSQL
5. Ejecuta `node server.js`

## Levantando el Frontend
1. Abre otra terminal en la carpeta del frontend.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev`.
4. Abre el enlace que aparece en la terminal `http://localhost:5173`

## Credenciales de Acceso en el Login
Una vez ejecutado el backend y frontedn, ingresar al sistema con las siguientes credenciales de prueba:

* **Correo/Usuario:** admin
* **Contraseña:** 1234
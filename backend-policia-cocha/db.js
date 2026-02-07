
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
});

// Mensaje de conexión 
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error adquiriendo cliente', err.stack);
    }
    console.log('Base de Datos Conectada (desde db.js)');
    release();
});

module.exports = { pool };
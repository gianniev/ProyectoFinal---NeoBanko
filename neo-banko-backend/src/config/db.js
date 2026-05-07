const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✅ Conectado exitosamente a PostgreSQL (neo-banko)');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión con PostgreSQL:', err.message);
});

module.exports = pool;
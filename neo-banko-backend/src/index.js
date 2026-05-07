const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const pool = require('./config/db');
const { getJwtSecret } = require('./config/env');
const configurePassport = require('./config/passport');
const runMigrations = require('./database/migrations/init');
const authRoutes = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauthRoutes');

dotenv.config();

try {
  getJwtSecret();
} catch (error) {
  console.error(`Configuracion invalida de JWT: ${error.message}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

configurePassport();

app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: false,
  })
);
app.use(express.json());
app.use(passport.initialize());

runMigrations().then(() => {
  console.log('Migraciones finalizadas - servidor listo');
});

app.use('/api/auth', authRoutes);
app.use('/auth', oauthRoutes);

app.get('/', (_req, res) => {
  res.json({
    message: 'Servidor de Neo Banko funcionando correctamente',
    database: 'neo-banko',
    status: 'online',
  });
});

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      serverTime: result.rows[0].now,
      message: 'Conexion a PostgreSQL exitosa',
    });
  } catch (error) {
    console.error('Error en /api/health:', error.message);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});

console.log('Servidor iniciado - Intentando conectar a PostgreSQL...');

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { getJwtSecret } = require('../config/env');

function issueToken(user) {
  const jwtSecret = getJwtSecret();

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
}

function toPublicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    avatar_url: user.avatar_url || null,
  };
}

const register = async (req, res) => {
  const { dni, nombre, apellido, email, password, telefono } = req.body;

  try {
    if (!dni || !nombre || !apellido || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Los campos dni, nombre, apellido, email y password son obligatorios',
      });
    }

    if (nombre.length < 2 || apellido.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y apellido deben tener al menos 2 caracteres',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contrasena debe tener al menos 6 caracteres',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es valido',
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR dni = $2',
      [email.toLowerCase(), dni.toUpperCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El email o el DNI ya estan registrados',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (dni, nombre, apellido, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, apellido, email, avatar_url`,
      [dni.toUpperCase(), nombre.trim(), apellido.trim(), email.toLowerCase(), passwordHash, telefono || null]
    );

    const newUser = result.rows[0];

    await pool.query(
      `INSERT INTO accounts (user_id, account_number, balance, currency)
       VALUES ($1, $2, 10000.00, 'EUR')`,
      [newUser.id, `ACC-${Date.now().toString().slice(-8)}`]
    );

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. Ya puedes iniciar sesion.',
      user: toPublicUser(newUser),
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el usuario',
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son obligatorios',
      });
    }

    const result = await pool.query(
      'SELECT id, nombre, apellido, email, password_hash, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email o contrasena incorrectos',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email o contrasena incorrectos',
      });
    }

    const token = issueToken(user);

    res.json({
      success: true,
      message: 'Inicio de sesion exitoso',
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, nombre, apellido, email, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user: toPublicUser(result.rows[0]),
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contrasena actual y nueva contrasena son obligatorias',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contrasena debe tener al menos 6 caracteres',
      });
    }

    const userId = req.user.id;
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        message: 'La contrasena actual no es correcta',
      });
    }

    const samePassword = await bcrypt.compare(newPassword, result.rows[0].password_hash);
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contrasena no puede ser igual a la actual',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    return res.json({
      success: true,
      message: 'Contrasena actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al cambiar contrasena:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

module.exports = { register, login, getMe, changePassword, issueToken };

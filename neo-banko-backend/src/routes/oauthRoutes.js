const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { getJwtSecret } = require('../config/env');

const router = express.Router();

function buildFrontendCallbackUrl(params = {}) {
  const baseUrl =
    process.env.GOOGLE_AUTH_SUCCESS_REDIRECT ||
    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`;

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure', session: false }),
  (req, res) => {
    let jwtSecret;
    try {
      jwtSecret = getJwtSecret();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        nombre: req.user.nombre,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const redirectUrl = buildFrontendCallbackUrl({ token });
    return res.redirect(redirectUrl);
  }
);

router.get('/google/failure', (_req, res) => {
  const redirectUrl = buildFrontendCallbackUrl({ error: 'google_auth_failed' });
  return res.redirect(redirectUrl);
});

router.post('/logout', (_req, res) => {
  return res.json({
    success: true,
    message: 'Sesion cerrada correctamente',
  });
});

module.exports = router;
